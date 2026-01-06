import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

import ResponseError from "../utils/response-error";

export default function ErrorMiddleware(error: unknown, req: Request, res: Response, next: NextFunction) {
    // Zod Validation Error
    if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
        }));

        const response = new ResponseError({
            status: 400,
            message: "Validation failed",
            code: "VALIDATION_ERROR",
            details,
        });

        return res.status(response.status).json(response.toJSON());
    }

    // Custom ResponseError
    if (error instanceof ResponseError) {
        return res.status(error.status).json(error.toJSON());
    }

    // Fallback for generic error
    if (error instanceof Error) {
        const lines =
            error.message?.split("\n").map((line) => line.trim()).filter(Boolean) || [];
        const title = lines[0] || "Internal Server Error";
        const lastLine = lines[lines.length - 1];
        const argumentMatch = lastLine?.match(/Argument `(.*?)` is missing/);

        const response = new ResponseError({
            status: 500,
            message: title,
            code: "INTERNAL_SERVER_ERROR",
            details: {
                message: lastLine,
                ...(argumentMatch ? { argument: argumentMatch[1] } : {}),
            },
        });

        return res.status(response.status).json(response.toJSON());
    }

    // Unknown error
    const response = new ResponseError({
        status: 500,
        message: "Unknown error occurred",
        code: "UNKNOWN_ERROR",
    });

    return res.status(response.status).json(response.toJSON());
}