// dependencies
import rateLimit from "express-rate-limit";

// rate limiter (in minutes, max requests)
const limiter = (windowMs: number, max: number = 3) => {
    return rateLimit({
        windowMs: windowMs * 60 * 1000,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            const r = req as any;
            res.status(429).json({
                status: 429,
                message: "Too many requests, please try again later.",
                code: "ERR_RATE_LIMIT",
                details: {
                    retry_after: r.rateLimit?.resetTime
                        ? `${Math.ceil((r.rateLimit.resetTime.getTime() - Date.now()) / 1000)} seconds`
                        : undefined
                }
            });
        }
    });
};

// export default
export default limiter;