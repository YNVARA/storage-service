CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE storage.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_file_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    extension VARCHAR(20),
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    total_chunks INTEGER NOT NULL,
    uploaded_chunks INTEGER NOT NULL DEFAULT 0,
    bucket_name TEXT,
    object_key TEXT,
    checksum_sha256 TEXT,
    status VARCHAR(20) NOT NULL,
    created_by UUID,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS storage.upload_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES storage.sessions(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_size BIGINT NOT NULL,
    checksum TEXT,
    storage_path TEXT,
    uploaded BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, chunk_index)
);
