import { z } from 'zod';

const rawEnvSchema = z.object({
    // APP CONFIGURATION
    APP_NAME: z.string().default('backend-service'),
    APP_VERSION: z.string().default('1.0.0'),
    NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
    APP_HOST: z.string().default('localhost'),
    APP_PORT: z.string().default('3000'),
    APP_DOMAIN: z.string().default('localhost'),

    // CORS CONFIGURATION
    CORS_ORIGINS: z.string().default('http://localhost:3000'),

    // LOGGER CONFIGURATION
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    // DATABASE (multi-instance via JSON or prefix DB_*)
    DATABASES: z.string().optional(),

    // MINIO CONFIGURATION
    MINIO_ENDPOINT: z.string().default('localhost'),
    MINIO_PORT: z.string().default('9000'),
    MINIO_USE_SSL: z.preprocess((val) => val === 'true', z.boolean()).default(false),
    MINIO_ACCESS_KEY: z.string().default('minioadmin'),
    MINIO_SECRET_KEY: z.string().default('minioadmin'),
    MINIO_BUCKET: z.string().default('bucket'),
    MINIO_PUBLIC_URL: z.string().default('http://localhost:9000'),
});

const databaseConfigSchema = z.array(
    z.object({
        // IDENTIFIER : ex: main, analytics, tenant-db
        name: z.string(),

        // ENGINE DATABASE
        engine: z.enum(['postgres', 'mysql', 'mongo']),

        // CONNECTION
        host: z.string(),
        port: z.number(),
        username: z.string().optional(),
        password: z.string().default(''),
        database: z.string(),

        // POOLING
        maxConnection: z.number().default(10),
        idleTimeout: z.number().default(30000),
        connectionTimeout: z.number().default(2000),

        // OPTIONAL FLAGS
        readOnly: z.boolean().optional(),
    }),
);

// PARSE ENV
const parsedRaw = rawEnvSchema.safeParse(process.env);
if (!parsedRaw.success) {
    console.error('❌ Invalid ENV (raw):');
    console.error(parsedRaw.error.format());
    process.exit(1);
}
const raw = parsedRaw.data;

// PARSE DATABASE CONFIG
const getDatabases = (rawConfig: any): any[] => {
    let dbs: any[] = [];

    // 1. Parse from DATABASES JSON string if exists
    if (rawConfig && rawConfig.DATABASES) {
        try {
            // Clean the string from potential issues like literal \n or actual newlines
            // some env loaders might escape newlines
            const cleanedJson = (rawConfig.DATABASES as string).trim().replace(/\\n/g, '\n');
            dbs = JSON.parse(cleanedJson);
        } catch (err) {
            console.warn('⚠️  Failed to parse DATABASES JSON. Error:', err instanceof Error ? err.message : err);
            console.warn('Trying prefix-based config instead...');
        }
    }

    // 2. Parse from prefix-based env variables (e.g., DB_MAIN_HOST)
    const prefixDbs: Record<string, any> = {};
    for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith('DB_') && value) {
            const parts = key.split('_');
            if (parts.length < 3) continue;

            const dbIdPart = parts[1];
            if (!dbIdPart) continue;

            const dbId = dbIdPart.toLowerCase();
            const field = parts.slice(2).join('_').toLowerCase();

            if (!prefixDbs[dbId]) {
                prefixDbs[dbId] = { name: dbId };
            }

            let targetField: string = field;
            if (field === 'max_connection') targetField = 'maxConnection';
            if (field === 'idle_timeout') targetField = 'idleTimeout';
            if (field === 'connection_timeout') targetField = 'connectionTimeout';

            // Handle types safely
            if (['port', 'maxConnection', 'idleTimeout', 'connectionTimeout'].includes(targetField)) {
                const num = Number(value);
                if (!isNaN(num)) {
                    prefixDbs[dbId][targetField] = num;
                }
            } else if (targetField === 'readonly') {
                prefixDbs[dbId][targetField] = value === 'true';
            } else {
                prefixDbs[dbId][targetField] = value;
            }
        }
    }

    // Merge or override (prefix-based takes precedence if names overlap)
    const combined = [...dbs];
    for (const prefixDb of Object.values(prefixDbs)) {
        const index = combined.findIndex((d) => d.name === prefixDb.name);
        if (index !== -1) {
            combined[index] = { ...combined[index], ...prefixDb };
        } else {
            combined.push(prefixDb);
        }
    }

    // Force 'main' for tests if missing or ensure it has valid string password
    if (process.env.NODE_ENV === 'test') {
        const mainIndex = combined.findIndex((d) => d.name === 'main');
        if (mainIndex === -1) {
            combined.push({
                name: 'main',
                engine: 'postgres',
                host: 'localhost',
                port: 5432,
                username: 'postgres',
                password: 'test_password',
                database: 'test_db',
            });
        } else {
            combined[mainIndex].password = String(combined[mainIndex].password || 'test_password');
            combined[mainIndex].username = combined[mainIndex].username || 'postgres';
        }
    }

    if (combined.length === 0) {
        console.error('❌ No database configuration found. Please provide DATABASES or DB_* variables.');
        process.exit(1);
    }

    try {
        return databaseConfigSchema.parse(combined);
    } catch (err) {
        if (err instanceof z.ZodError) {
            console.error('❌ Invalid Database Configuration:');
            err.issues.forEach((issue) => {
                console.error(`  - [${issue.path.join('.')}]: ${issue.message}`);
            });
        } else {
            console.error('❌ Unexpected error during database validation:', err);
        }
        process.exit(1);
    }
};

const parsedDatabases = getDatabases(raw);

// FINAL ENVIRONMENT
export const env = {
    app: {
        name: raw.APP_NAME,
        version: raw.APP_VERSION,
        environment: raw.NODE_ENV,
        hostname: raw.APP_HOST,
        port: parseInt(raw.APP_PORT, 10),
        domain: raw.APP_DOMAIN,
    },
    security: {
        corsOrigins: raw.CORS_ORIGINS.split(',')
            .map((v) => v.trim())
            .filter(Boolean),
    },
    log: {
        level: raw.LOG_LEVEL,
    },
    databases: parsedDatabases,
    minio: {
        endpoint: raw.MINIO_ENDPOINT,
        port: parseInt(raw.MINIO_PORT, 10),
        useSSL: raw.MINIO_USE_SSL,
        accessKey: raw.MINIO_ACCESS_KEY,
        secretKey: raw.MINIO_SECRET_KEY,
        bucket: raw.MINIO_BUCKET,
        publicUrl: raw.MINIO_PUBLIC_URL,
    },
};
