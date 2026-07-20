import type { BaseDatabaseConfig, DatabaseClient, TransactionClient, QueryResult, QueryResultRow } from './types';
import { Pool, type PoolClient } from 'pg';
import { logger } from '../logger';

export class PostgresClient implements DatabaseClient {
    private pool: Pool;
    private config: BaseDatabaseConfig;

    private isClosed = false;
    private closingPromise: Promise<void> | null = null;

    constructor(config: BaseDatabaseConfig) {
        this.config = config;

        this.pool = new Pool({
            host: config.host,
            port: config.port,
            user: config.username || 'postgres',
            password: String(config.password || ''),
            database: config.database,
            max: config.maxConnection,
            idleTimeoutMillis: config.idleTimeout,
            connectionTimeoutMillis: config.connectionTimeout,
        });

        this.transaction = this.transaction.bind(this);
        this.query = this.query.bind(this);

        this.pool.on('connect', () => {
            logger.info({ db: config.name }, 'PostgreSQL connected');
        });

        this.pool.on('error', (err) => {
            logger.error({ err, db: config.name }, 'PostgreSQL pool error');
        });
    }

    async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
        if (this.isClosed) {
            throw new Error('Database already closed');
        }

        const client = await this.pool.connect();

        try {
            const result = await client.query<T>(text, params);
            return {
                rows: result.rows,
                rowCount: result.rowCount ?? undefined,
            };
        } catch (error) {
            logger.error({ error, query: text, params, db: this.config.name }, 'DB Query Error');
            throw error;
        } finally {
            client.release();
        }
    }

    async transaction<T>(callback: (client: TransactionClient) => Promise<T>): Promise<T> {
        if (this.isClosed) {
            throw new Error('Database already closed');
        }

        const client: PoolClient = await this.pool.connect();

        const txClient: TransactionClient = {
            query: async <T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
                const result = await client.query<T>(text, params);

                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? undefined,
                };
            },
        };

        try {
            await client.query('BEGIN');
            const result = await callback(txClient);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');

            logger.error({ error }, 'Transaction failed');

            throw error;
        } finally {
            client.release();
        }
    }

    async close(): Promise<void> {
        if (this.isClosed) return;
        if (this.closingPromise) return this.closingPromise;
        this.closingPromise = (async () => {
            await this.pool.end();
            this.isClosed = true;

            logger.info({ db: this.config.name }, 'PostgreSQL closed');
        })();

        return this.closingPromise;
    }
}
