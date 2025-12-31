import type { Response as ExpressResponse } from "express";

type Response = {
    status: number;
    message?: string;
    code?: string;
    data?: any;
};

export default class ResponseSuccess implements Response {
    public status: number;
    public message?: string;
    public code?: string;
    public data?: any;

    constructor({ status = 200, code, message, data }: Partial<Omit<Response, "timestamp">>) {
        this.status = status ?? 200;
        this.code = code;
        this.message = message;
        this.data = data;
    }

    toJSON(): Response {
        return {
            status: this.status,
            code: this.code,
            message: this.message,
            data: this.data,
        };
    }

    // 👉 kirim langsung ke Express response
    send(res: ExpressResponse) {
        return res.status(this.status).json(this.toJSON());
    }
}