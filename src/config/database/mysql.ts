import mysql, { type Pool, type PoolConnection, type ResultSetHeader, type RowDataPacket } from 'mysql2/promise';
import type { BaseDatabaseConfig, DatabaseClient, TransactionClient, QueryResult, QueryResultRow } from './types';
import { logger } from '../logger';

export class MysqlClient implements DatabaseClient {
    private pool: Pool;
    private config: BaseDatabaseConfig;

    private isClosed = false;
    private closingPromise: Promise<void> | null = null;

    constructor(config: BaseDatabaseConfig) {
        this.config = config;

        this.pool = mysql.createPool({
            host: config.host,
            port: config.port,
            user: config.username,
            password: config.password,
            database: config.database,
            connectionLimit: config.maxConnection,
            idleTimeout: config.idleTimeout,
            connectTimeout: config.connectionTimeout,
        });

        logger.info({ db: config.name }, 'MySQL pool initialized');
    }

    async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
        if (this.isClosed) {
            throw new Error('Database already closed');
        }

        try {
            const [rows] = await this.pool.execute<(T[] & RowDataPacket[][]) | ResultSetHeader>(text, params);

            // mysql2 returns an array where the first element is the result.
            // If it's a SELECT, it's an array of rows.
            // If it's DML (INSERT/UPDATE/DELETE), it's a ResultSetHeader.

            const isArray = Array.isArray(rows);
            return {
                rows: isArray ? (rows as T[]) : ([] as T[]),
                rowCount: isArray ? (rows as T[]).length : (rows as ResultSetHeader).affectedRows,
            };
        } catch (error) {
            logger.error({ error, query: text, params, db: this.config.name }, 'DB Query Error');
            throw error;
        }
    }

    async transaction<T>(callback: (client: TransactionClient) => Promise<T>): Promise<T> {
        if (this.isClosed) {
            throw new Error('Database already closed');
        }

        const connection: PoolConnection = await this.pool.getConnection();

        const txClient: TransactionClient = {
            query: async <T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
                const [rows] = await connection.execute<(T[] & RowDataPacket[][]) | ResultSetHeader>(text, params);
                const isArray = Array.isArray(rows);
                return {
                    rows: isArray ? (rows as T[]) : ([] as T[]),
                    rowCount: isArray ? (rows as T[]).length : (rows as ResultSetHeader).affectedRows,
                };
            },
        };

        try {
            await connection.beginTransaction();
            const result = await callback(txClient);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            logger.error({ error }, 'Transaction failed');
            throw error;
        } finally {
            connection.release();
        }
    }

    async close(): Promise<void> {
        if (this.isClosed) return;
        if (this.closingPromise) return this.closingPromise;

        this.closingPromise = (async () => {
            await this.pool.end();
            this.isClosed = true;
            logger.info({ db: this.config.name }, 'MySQL closed');
        })();

        return this.closingPromise;
    }
}
