type Response = {
    status: number,     // HTTP status : 200, 400, etc
    message?: string,   // Error message : "Bad request"
    code?: string,      // Error code : "ERR_BAD_REQUEST"
    details?: any       // Error details : { message: "User already exists" }
}

export default class ResponseError extends Error {
    public status: number;
    public code?: string;
    public details?: any;

    constructor({ status, message, code, details }: Response) {
        super(message);
        this.name = "ResponseError";

        this.status = status;
        this.code = code;
        this.details = details;

        Object.setPrototypeOf(this, new.target.prototype);
    }

    toJSON() {
        return {
            status: this.status,
            code: this.code,
            message: this.message,
            details: this.details,
        };
    }
}