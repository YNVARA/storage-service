import { HttpError } from './http.error';
import { ErrorCodes } from './error-codes';

export class BadRequestError extends HttpError {
    constructor(message = 'Bad Request', details?: any) {
        super(400, message, ErrorCodes.BAD_REQUEST, true, details);
    }
}

export class UnauthorizedError extends HttpError {
    constructor(message = 'Unauthorized') {
        super(401, message, ErrorCodes.UNAUTHORIZED, true);
    }
}

export class ForbiddenError extends HttpError {
    constructor(message = 'Forbidden') {
        super(403, message, ErrorCodes.FORBIDDEN, true);
    }
}

export class NotFoundError extends HttpError {
    constructor(message = 'Not Found') {
        super(404, message, ErrorCodes.NOT_FOUND, true);
    }
}

export class SystemError extends HttpError {
    constructor(message = 'Internal Server Error', details?: any) {
        super(500, message, ErrorCodes.INTERNAL_ERROR, false, details);
    }
}
