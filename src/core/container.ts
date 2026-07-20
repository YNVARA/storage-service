import { databaseManager } from '../config/database';
import { logger } from '../config/logger';

export interface Container {
    logger: typeof logger;
    db: typeof databaseManager;
}

export const container: Container = {
    logger,
    db: databaseManager,
};
