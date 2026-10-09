-- TRUSTRACE Zero-Trust PostgreSQL 16 + pgvector Schema with RLS
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Document Classification Enum
CREATE TYPE classification_level AS ENUM ('Public', 'Confidential', 'Restricted');

-- Documents Table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    classification classification_level NOT NULL DEFAULT 'Confidential',
    doc_type VARCHAR(50) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    file_size VARCHAR(20) NOT NULL,
    pages_count INT NOT NULL DEFAULT 1,
    version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    is_honeytoken BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vector Chunks Table with HNSW Index
CREATE TABLE chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    content TEXT NOT NULL,
    classification classification_level NOT NULL,
    department VARCHAR(100) NOT NULL,
    embedding vector(1536)
);

CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops);

-- Row-Level Security (RLS) Policy for Pre-Retrieval Filtering (Gate 1)
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY gate1_pre_retrieval_policy ON chunks
    FOR SELECT
    USING (
        classification = 'Public'
        OR (
            current_setting('app.user_clearance')::classification_level >= classification
            AND (department = current_setting('app.user_department') OR current_setting('app.user_grants') LIKE '%*%')
        )
    );

-- Hash-Chained Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_index BIGSERIAL NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    prev_hash VARCHAR(64) NOT NULL,
    hash VARCHAR(64) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    decision VARCHAR(20) NOT NULL,
    details TEXT
) PARTITION BY RANGE (timestamp);
