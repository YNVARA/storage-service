// DEPENDENCIES
import type { Express } from 'express';

// CORE
import type { Module } from '../core/module';
import { container } from '../core/container';

// IMPORT MODULES DI SINI
import {uploadModule} from '../module/upload';

const modules: Module[] = [
    uploadModule
];

// STRATEGY CONFIG
// TRUE = HARD FAIL | FALSE = SKIP
const MODULE_INIT_STRATEGY = {
    failFast: true,
};

// REGISTER ALL MODULES
export const registerModules = async (app: Express) => {
    const logger = container.logger;

    logger.info({ action: 'modules_register_start', total: modules.length }, '🚀 Registering modules...');

    for (const module of modules) {
        const start = Date.now();
        logger.info(
            {
                module: module.name,
                action: 'module_init_start',
            },
            'Initializing module',
        );

        try {
            // LIFECYCLE INIT
            if (module.onInit) {
                await module.onInit(container);
            }

            // REGISTER ROUTES
            module.register(app, container);
            const duration = Date.now() - start;

            logger.info(
                {
                    module: module.name,
                    action: 'module_init_success',
                    duration,
                },
                'Module registered',
            );
        } catch (err) {
            const duration = Date.now() - start;
            logger.error(
                {
                    module: module.name,
                    action: 'module_init_failed',
                    duration,
                    err,
                },
                'Module initialization failed',
            );

            // STRATEGY DECISSION
            if (MODULE_INIT_STRATEGY.failFast) {
                logger.fatal(
                    {
                        module: module.name,
                        action: 'system_boot_abort',
                    },
                    'Critical module failed. Aborting startup.',
                );

                throw err;
            }

            // SOFT FAIL - LANJUT MODULE BERIKUT NYA
            logger.warn(
                {
                    module: module.name,
                    action: 'module_skipped',
                },
                'Skipping failed module',
            );
        }
    }

    logger.info({ action: 'modules_register_done' }, '✅ All modules registered');
};

// GRACEFULL SHUTDOWN
let isShuttingDown = false;
let shutdownPromise: Promise<void> | null = null;

export const shutdownModules = async () => {
    const logger = container.logger;

    if (isShuttingDown) {
        logger.warn('Shutdown already in progress');
        return shutdownPromise;
    }

    isShuttingDown = true;

    shutdownPromise = (async () => {
        logger.info('🛑 Shutting down modules...');
        for (const module of modules) {
            try {
                if (module.onDestroy) {
                    await module.onDestroy(container);
                }

                logger.info({ module: module.name }, 'Module destroyed');
            } catch (err) {
                logger.error({ module: module.name, err }, 'Module destroy failed');
            }
        }

        await container.db.closeAll();
        logger.info('✅ Shutdown complete');
    })();

    return shutdownPromise;
};
