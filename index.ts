// import dependencies
import express from "express";

// import configs and initializers
import { APP_CONFIG } from "./config";

// import middlewares
import ErrorMiddleware from "./middlewares/error.middleware";

// initialize
async function bootstrap() {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(ErrorMiddleware);

    app.listen(APP_CONFIG.PORT, () => {
        console.log(`🚀 Server running at http://${APP_CONFIG.HOST}:${APP_CONFIG.PORT}`);
    });
}

bootstrap().catch(err => {
    console.error("❌ Fatal startup error:", err);
    process.exit(1);
});