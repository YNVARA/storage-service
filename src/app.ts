import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';

import { container } from './core/container';
import { env } from './config/env';
import { setupOpenApi } from './config/openapi';

import { requestContextMiddleware } from './shared/middleware/request-context.middleware';
import { responseLoggerMiddleware } from './shared/middleware/response-logger.middleware';
import { globalRateLimit } from './shared/middleware/rate-limit.middleware';

export const createApp = (): Express => {
    const app = express();
    const logger = container.logger;

    // 🔐 SECURITY
    app.use(
        helmet({
            contentSecurityPolicy: false,
        }),
    );
    const corsOrigins = env.security.corsOrigins;
    app.use(
        cors({
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (corsOrigins.includes(origin)) return callback(null, true);
                callback(new Error('CORS blocked'));
            },
            credentials: true,
        }),
    );

    // 🔄 PARSER
    app.use(express.json());
    app.use(cookieParser());
    app.use(express.urlencoded({ extended: true }));

    // 🧠 REQUEST CONTEXT
    app.use(requestContextMiddleware);

    // 🚦 RATE LIMIT
    app.use(globalRateLimit);

    // 📊 RESPONSE LOGGER
    app.use(responseLoggerMiddleware);

    // 📖 OPENAPI DOCS (SCALAR)
    setupOpenApi(app);

    // ❤️ HEALTH CHECK
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            service: env.app.name,
            version: env.app.version,
            env: env.app.environment,
        });
    });

    logger.info('App initialized');
    return app;
};
