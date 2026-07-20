import { container } from '../container';
import { requestContext } from '../context/request-context';

// REMOVE UNDEFINED FIELDS
const clean = (obj: Record<string, any>) => {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
};

export const getLogger = (meta?: Record<string, any>) => {
    const base = container.logger;
    const ctx = requestContext.tryGet();

    const contextFields = clean({
        requestId: ctx?.requestId || 'unknown',
    });

    const metaFields = clean(meta || {});

    return base.child({
        ...contextFields,
        ...metaFields,
    });
};
