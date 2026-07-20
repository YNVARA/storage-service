export class HttpError extends Error {
    public status: number;
    public code: string;
    public isOperational: boolean;
    public details?: any;

    constructor(status: number, message: string, code: string, isOperational: boolean, details?: any) {
        super(message);

        this.status = status;
        this.code = code;
        this.isOperational = isOperational;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}
