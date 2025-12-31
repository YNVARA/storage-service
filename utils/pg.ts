// // dependencies
import { Pool } from "pg";

// // environment variables
import { PG_CONFIG } from "../config";

const pg = new Pool({
    host: PG_CONFIG.HOST,
    port: PG_CONFIG.PORT ? parseInt(PG_CONFIG.PORT, 10) : undefined,
    user: PG_CONFIG.USER,
    password: PG_CONFIG.PASSWORD,
    database: PG_CONFIG.DATABASE,
    max: PG_CONFIG.MAX_CONNECTION ? parseInt(PG_CONFIG.MAX_CONNECTION, 10) : undefined,
    idleTimeoutMillis: PG_CONFIG.IDLE_TIMEOUT ? parseInt(PG_CONFIG.IDLE_TIMEOUT, 10) : undefined,
    connectionTimeoutMillis: PG_CONFIG.CONNECTION_TIMEOUT ? parseInt(PG_CONFIG.CONNECTION_TIMEOUT, 10) : undefined,
});

// // export default
export default pg;