export type DatabaseEngine = 'postgres' | 'mysql' | 'mongo';

export type TenantEngine = 'POSTGRESQL' | 'MARIADB' | 'MONGODB';

export const mapTenantEngineToDatabaseEngine = (engine: TenantEngine): DatabaseEngine => {
    switch (engine) {
        case 'POSTGRESQL':
            return 'postgres';
        case 'MARIADB':
            return 'mysql';
        case 'MONGODB':
            return 'mongo';
        default:
            throw new Error(`Unknown engine: ${engine}`);
    }
};

export interface TenantDatabaseConfig {
    tenant_id: string;
    engine: TenantEngine;
    host: string;
    port: number;
    db_name: string;
    username: string;
    encrypted_password: string;
}

export type QueryResultRow = Record<string, any>;

export interface BaseDatabaseConfig {
    name: string;
    engine: DatabaseEngine;
    host: string;
    port: number;
    username?: string;
    password?: string;
    database: string;
    maxConnection?: number;
    idleTimeout?: number;
    connectionTimeout?: number;
    readOnly?: boolean;
}

export interface QueryResult<T = any> {
    rows: T[];
    rowCount?: number;
}

export interface DatabaseClient {
    query<T extends QueryResultRow = any>(query: string, params?: any[]): Promise<QueryResult<T>>;
    transaction?<T>(callback: (client: TransactionClient) => Promise<T>): Promise<T>;
    close(): Promise<void>;
}

export interface TransactionClient {
    query<T extends QueryResultRow = any>(query: string, params?: any[]): Promise<QueryResult<T>>;
}
