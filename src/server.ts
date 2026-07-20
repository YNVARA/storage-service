import { registerModules, shutdownModules } from './bootstrap/register-modules';
import { errorMiddleware } from './shared/middleware/error.middleware';
import { container } from './core/container';
import { env } from './config/env';
import { createApp } from './app';

const logger = container.logger;

const startServer = async () => {
    try {
        // CREATE APP
        const app = createApp();

        // REGISTER MODULES
        await registerModules(app);

        // ❌ ERROR HANDLER (MUST BE AFTER ALL ROUTES/MODULES)
        app.use(errorMiddleware);

        // START SERVER
        const server = app.listen(env.app.port, env.app.hostname, () => {
            logger.info(
                {
                    port: env.app.port,
                    host: env.app.hostname,
                    env: env.app.environment,
                },
                '🚀 Server started',
            );
        });

        // GRACEFUL SHUTDOWN
        let isShuttingDown = false;

        const shutdown = async (signal: string) => {
            if (isShuttingDown) {
                logger.warn({ signal }, 'Shutdown already in progress');
                return;
            }

            isShuttingDown = true;

            logger.warn({ signal }, 'Shutdown signal received');

            // stop HTTP first
            server.close(async () => {
                logger.info('HTTP server closed');

                try {
                    await shutdownModules();
                    process.exit(0);
                } catch (err) {
                    logger.error({ err }, 'Shutdown failed');
                    process.exit(1);
                }
            });

            // hard timeout (anti-hang)
            setTimeout(() => {
                logger.error('Force shutdown');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

        // UNHANDLE ERROR GUARD
        process.on('unhandledRejection', (reason) => {
            logger.error({ reason }, 'Unhandled Rejection');
        });

        process.on('uncaughtException', (error) => {
            logger.fatal({ error }, 'Uncaught Exception');
            process.exit(1);
        });
    } catch (error) {
        logger.fatal({ error }, 'Failed to start server');
        process.exit(1);
    }
};

startServer();
