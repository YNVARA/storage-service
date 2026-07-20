import type { BaseDatabaseConfig, DatabaseClient, TransactionClient, QueryResult, QueryResultRow } from './types';
import { MongoClient as MongoDriver, Db, ClientSession } from 'mongodb';
import { logger } from '../logger';

export class MongoClient implements DatabaseClient {
    private client: MongoDriver;
    private dbName: string;
    private config: BaseDatabaseConfig;

    private isClosed = false;
    private closingPromise: Promise<void> | null = null;

    constructor(config: BaseDatabaseConfig) {
        this.config = config;
        this.dbName = config.database;

        // Construct MongoDB URI
        // Format: mongodb://[username:password@]host[:port]/[database]
        const auth = config.username && config.password ? `${config.username}:${config.password}@` : '';
        const uri = `mongodb://${auth}${config.host}:${config.port}/${config.database}`;

        this.client = new MongoDriver(uri, {
            maxPoolSize: config.maxConnection,
            connectTimeoutMS: config.connectionTimeout,
            waitQueueTimeoutMS: config.idleTimeout,
        });

        // Trigger connection
        this.client
            .connect()
            .then(() => logger.info({ db: config.name }, 'MongoDB connected'))
            .catch((err) => logger.error({ err, db: config.name }, 'MongoDB connection error'));
    }

    /**
     * For MongoDB, the 'query' method is interpreted as a direct command execution
     * or a way to get the DB instance. For basic DatabaseClient compatibility,
     * we return the rows as an empty array or handle specific command logic if needed.
     *
     * NOTE: MongoDB is Document-based, so a SQL-like query interface is limited.
     */
    async query<T extends QueryResultRow = any>(command: string, params?: any[]): Promise<QueryResult<T>> {
        if (this.isClosed) {
            throw new Error('Database already closed');
        }

        // Implementation for MongoDB 'query' can be custom-tailored.
        // For now, we return empty rows as MongoDB uses collection-based methods.
        // Users should ideally use the driver instance directly for complex operations.
        logger.warn({ command, db: this.config.name }, 'MongoDB query called. Ensure you are using collection methods for complex logic.');

        return {
            rows: [],
        };
    }

    /**
     * Access the raw MongoDB Database instance.
     */
    getDb(): Db {
        return this.client.db(this.dbName);
    }

    async transaction<T>(callback: (client: TransactionClient) => Promise<T>): Promise<T> {
        if (this.isClosed) {
            throw new Error('Database already closed');
        }

        const session: ClientSession = this.client.startSession();

        const txClient: TransactionClient = {
            query: async <T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
                // Transactions in Mongo often involve passing the session to collection methods.
                // This wrapper is for interface compatibility.
                return { rows: [] };
            },
        };

        try {
            let result: T;
            await session.withTransaction(async () => {
                result = await callback(txClient);
            });
            return result!;
        } catch (error) {
            logger.error({ error }, 'MongoDB Transaction failed');
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async close(): Promise<void> {
        if (this.isClosed) return;
        if (this.closingPromise) return this.closingPromise;

        this.closingPromise = (async () => {
            await this.client.close();
            this.isClosed = true;
            logger.info({ db: this.config.name }, 'MongoDB closed');
        })();

        return this.closingPromise;
    }
}
