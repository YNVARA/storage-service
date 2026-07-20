import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';
import { HttpError } from '../../core/errors/http.error';

export const validate = (schema: ZodTypeAny) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
    });

    if (!result.success) {
        const details = result.error.issues.map((issue) => ({
            path: issue.path.length > 0 ? issue.path.join('.') : 'body',
            message: issue.message,
            code: issue.code,
        }));

        return next(new HttpError(400, 'Validation error', 'VALIDATION_ERROR', true, details));
    }

    const data = result.data as {
        body?: Record<string, unknown>;
        query?: Record<string, unknown>;
        params?: Record<string, unknown>;
    };

    if (data.body && typeof data.body === 'object') Object.assign(req.body, data.body);
    if (data.query && typeof data.query === 'object') Object.assign(req.query, data.query);
    if (data.params && typeof data.params === 'object') Object.assign(req.params, data.params);

    next();
};
