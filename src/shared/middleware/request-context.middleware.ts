import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { requestContext } from '../../core/context/request-context';

export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();

    const context = {
        requestId,
        startTime: Date.now(),
    };

    requestContext.run(context, () => {
        res.setHeader('x-request-id', requestId);
        next();
    });
};
