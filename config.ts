// import dependencies
import dotenv from "dotenv";

// initialize
dotenv.config();

// app config
export const APP_CONFIG = {
    NAME: process.env.APP_NAME,
    VERSION: process.env.APP_VERSION,
    HOST: process.env.APP_HOST,
    PORT: process.env.APP_PORT,
    ENVIRONMENT: process.env.APP_ENVIRONMENT,
    DOMAIN: process.env.APP_DOMAIN
}

// database config
export const PG_CONFIG = {
    HOST: process.env.PG_DB_HOST,
    PORT: process.env.PG_DB_PORT,
    USER: process.env.PG_DB_USER,
    PASSWORD: process.env.PG_DB_PASS,
    DATABASE: process.env.PG_DB_NAME,
    MAX_CONNECTION: process.env.PG_MAX_CONNECTION,
    IDLE_TIMEOUT: process.env.PG_IDLE_TIMEOUT,
    CONNECTION_TIMEOUT: process.env.PG_CONNECTION_TIMEOUT
}