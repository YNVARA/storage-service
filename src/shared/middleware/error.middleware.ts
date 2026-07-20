import type { Request, Response, NextFunction } from 'express';
import { classifyError } from '../../core/errors/error-classifier';
import { getLogger } from '../../core/logger/request-logger';
import { requestContext } from '../../core/context/request-context';
import { env } from '../../config/env';

export const errorMiddleware = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const logger = getLogger({ module: 'http-error' });
    const ctx = requestContext.tryGet();
    const error = classifyError(err);

    // DIFERENT LOG LEVE BASED ON TYPE
    if (error.isOperational) {
        logger.warn(
            {
                action: 'request_failed',
                type: 'operational',

                status: error.status,
                code: error.code,

                method: req.method,
                path: req.originalUrl,

                requestId: ctx?.requestId,
            },
            error.message,
        );
    } else {
        logger.error(
            {
                action: 'request_failed',
                type: 'system',

                status: error.status,
                code: error.code,

                method: req.method,
                path: req.originalUrl,

                requestId: ctx?.requestId,

                error: {
                    message: error.message,
                    stack: error.stack,
                },
            },
            'System error occurred',
        );
    }

    // SAFE RESPONSE
    const isProd = env.app.environment === 'production';

    res.status(error.status).json({
        success: false,
        error: {
            code: error.code,
            message: error.isOperational || !isProd ? error.message : 'Internal Server Error',
            ...(error.details ? { details: error.details } : {}),
        },
        meta: {
            requestId: ctx?.requestId,
        },
    });
};
