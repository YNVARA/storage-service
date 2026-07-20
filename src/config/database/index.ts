import type { BaseDatabaseConfig, DatabaseClient, TenantDatabaseConfig, TenantEngine } from './types';
import { mapTenantEngineToDatabaseEngine } from './types';
import { env } from '../env';

import { PostgresClient } from './postgres';
import { MysqlClient } from './mysql';
import { MongoClient } from './mongo';

// TODO: Implement actual decryption
const decryptPassword = (encrypted: string): string => encrypted;

class DatabaseManager {
    private clients: Map<string, DatabaseClient> = new Map();
    private tenantClients: Map<string, DatabaseClient> = new Map();

    constructor() {
        this.initialize();
    }

    private initialize() {
        for (const dbConfig of env.databases) {
            const client = this.createClient(dbConfig);
            this.clients.set(dbConfig.name, client);
        }
    }

    private createClient(config: BaseDatabaseConfig): DatabaseClient {
        switch (config.engine) {
            case 'postgres':
                return new PostgresClient(config);
            case 'mysql':
                return new MysqlClient(config);
            case 'mongo':
                return new MongoClient(config);
            default:
                throw new Error(`Unsupported engine: ${config.engine}`);
        }
    }

    // -----------------------------------------------------------------------
    // GET DB BY NAME
    // -----------------------------------------------------------------------
    get(name: string): DatabaseClient {
        const client = this.clients.get(name);
        if (!client) {
            throw new Error(`Database not found: ${name}`);
        }
        return client;
    }

    // -----------------------------------------------------------------------
    // GET TENANT DB (or primary if tenantId is omitted)
    // -----------------------------------------------------------------------
    async getTenantDatabase(tenantId?: string): Promise<DatabaseClient> {
        if (!tenantId) {
            return this.getPrimary();
        }

        if (this.tenantClients.has(tenantId)) {
            return this.tenantClients.get(tenantId)!;
        }

        const mainDb = this.getPrimary();
        const result = await mainDb.query<TenantDatabaseConfig>('SELECT * FROM tenants.databases WHERE tenant_id = $1', [tenantId]);

        if (result.rows.length === 0) {
            throw new Error(`Tenant database config not found for: ${tenantId}`);
        }

        const dbConfig = result.rows[0]!;

        const config: BaseDatabaseConfig = {
            name: `tenant-${tenantId}`,
            engine: mapTenantEngineToDatabaseEngine(dbConfig.engine),
            host: dbConfig.host,
            port: dbConfig.port,
            username: dbConfig.username,
            password: String(decryptPassword(dbConfig.encrypted_password) || ''),
            database: dbConfig.db_name,
        };

        const client = this.createClient(config);
        this.tenantClients.set(tenantId, client);
        return client;
    }

    // -----------------------------------------------------------------------
    // GET DB BY NAME
    // -----------------------------------------------------------------------
    getPrimary(): DatabaseClient {
        return this.get('main');
    }

    // -----------------------------------------------------------------------
    // EXAMPLE : GET READ ONLY DB
    // -----------------------------------------------------------------------
    getReadReplica(): DatabaseClient | null {
        for (const [_, client] of this.clients) {
            // naive check (you can improve later)
            return client;
        }
        return null;
    }

    async closeAll() {
        for (const client of this.clients.values()) {
            await client.close();
        }
        for (const client of this.tenantClients.values()) {
            await client.close();
        }
    }
}

export const databaseManager = new DatabaseManager();
