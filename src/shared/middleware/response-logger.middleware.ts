import type { Request, Response, NextFunction } from 'express';
import { getLogger } from '../../core/logger/request-logger';

export const responseLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logger = getLogger({
            module: 'http',
        });

        logger.info(
            {
                action: 'request_completed',
                method: req.method,
                path: req.originalUrl,
                statusCode: res.statusCode,
                duration,
            },
            'HTTP Request completed',
        );
    });

    next();
};
