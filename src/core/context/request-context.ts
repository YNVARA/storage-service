import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
    requestId: string;
    startTime: number;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export const requestContext = {
    run: (context: RequestContext, callback: () => void) => {
        asyncLocalStorage.run(context, callback);
    },

    get: (): RequestContext => {
        const store = asyncLocalStorage.getStore();
        if (!store) {
            throw new Error('RequestContext not initialized');
        }
        return store;
    },

    tryGet: (): RequestContext | undefined => {
        return asyncLocalStorage.getStore();
    },
};
