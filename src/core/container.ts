import { databaseManager } from '../config/database';
import { redisClient } from '../config/redis';
import { logger } from '../config/logger';

export interface Container {
    logger: typeof logger;
    db: typeof databaseManager;
    redis: typeof redisClient;
}

export const container: Container = {
    logger,
    db: databaseManager,
    redis: redisClient,
};
