import { Router } from 'express';
import { asyncHandler } from './async-handler';

export const createRouter = () => {
    const router = Router();
    const wrap = (handler: any) => asyncHandler(handler);

    return {
        router,
        get: (path: string, handler: any) => router.get(path, wrap(handler)),
        post: (path: string, handler: any) => router.post(path, wrap(handler)),
        patch: (path: string, handler: any) => router.patch(path, wrap(handler)),
        put: (path: string, handler: any) => router.put(path, wrap(handler)),
        delete: (path: string, handler: any) => router.delete(path, wrap(handler)),
    };
};
