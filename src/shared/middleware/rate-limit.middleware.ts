import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { requestContext } from '../../core/context/request-context';
import { getLogger } from '../../core/logger/request-logger';

export const globalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,

    standardHeaders: true,
    legacyHeaders: false,

    keyGenerator: (req) => {
        const ctx = requestContext.tryGet();
        return ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? 'unknown');
    },

    handler: (req, res) => {
        const logger = getLogger({ module: 'rate-limit' });
        const ctx = requestContext.tryGet();

        logger.warn(
            {
                action: 'rate_limit_exceeded',
                path: req.originalUrl,
                method: req.method,
                ip: req.ip,
            },
            'Rate limit exceeded',
        );

        res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests',
            },
            meta: {
                requestId: ctx?.requestId,
            },
        });
    },
});
