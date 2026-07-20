import { HttpError } from './http.error';
import { ErrorCodes } from './error-codes';

export type ClassifiedError = {
    status: number;
    code: string;
    message: string;
    isOperational: boolean;
    stack?: string;
    details?: any;
};

export const classifyError = (err: unknown): ClassifiedError => {
    // already HttpError
    if (err instanceof HttpError) {
        return {
            status: err.status,
            code: err.code,
            message: err.message,
            isOperational: err.isOperational,
            stack: err.stack,
            details: err.details,
        };
    }

    // Zod error
    if (err instanceof Error && err.name === 'ZodError') {
        return {
            status: 400,
            code: ErrorCodes.BAD_REQUEST,
            message: 'Validation error',
            isOperational: true,
            stack: err.stack,
            details: err,
        };
    }

    // fallback unknown system error
    return {
        status: 500,
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Internal Server Error',
        isOperational: false,
        stack: err instanceof Error ? err.stack : undefined,
    };
};
