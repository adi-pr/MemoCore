-- ============================================================
-- RAG DATABASE SCHEMA
-- Git repositories → Markdown → Chunks → Embeddings → RAG
-- PostgreSQL / Supabase
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;


-- ============================================================
-- REPOSITORIES
-- ============================================================

CREATE TABLE repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    provider VARCHAR(50) NOT NULL,
    external_id VARCHAR(255),

    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(500) NOT NULL,

    clone_url TEXT NOT NULL,
    default_branch VARCHAR(255) NOT NULL DEFAULT 'main',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT repositories_provider_full_name_unique
        UNIQUE (provider, full_name)
);


-- ============================================================
-- REPOSITORY VERSIONS
-- Represents a Git commit
-- ============================================================

CREATE TABLE repository_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    repository_id UUID NOT NULL,

    commit_sha VARCHAR(64) NOT NULL,
    branch VARCHAR(255),
    commit_message TEXT,
    committed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT repository_versions_repository_fk
        FOREIGN KEY (repository_id)
        REFERENCES repositories(id)
        ON DELETE CASCADE,

    CONSTRAINT repository_versions_repo_commit_unique
        UNIQUE (repository_id, commit_sha)
);


CREATE INDEX idx_repository_versions_repository_id
    ON repository_versions(repository_id);


CREATE INDEX idx_repository_versions_commit_sha
    ON repository_versions(commit_sha);


-- ============================================================
-- DOCUMENTS
-- Represents a Markdown file
-- ============================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    repository_id UUID NOT NULL,
    repository_version_id UUID NOT NULL,

    path TEXT NOT NULL,
    filename VARCHAR(500) NOT NULL,
    title VARCHAR(500),

    content TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,

    language VARCHAR(50) NOT NULL DEFAULT 'markdown',
    file_size INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT documents_repository_fk
        FOREIGN KEY (repository_id)
        REFERENCES repositories(id)
        ON DELETE CASCADE,

    CONSTRAINT documents_repository_version_fk
        FOREIGN KEY (repository_version_id)
        REFERENCES repository_versions(id)
        ON DELETE CASCADE
);


CREATE INDEX idx_documents_repository_id
    ON documents(repository_id);


CREATE INDEX idx_documents_repository_version_id
    ON documents(repository_version_id);


CREATE INDEX idx_documents_path
    ON documents(path);


CREATE INDEX idx_documents_content_hash
    ON documents(content_hash);


-- ============================================================
-- DOCUMENT CHUNKS
-- Markdown documents are split into chunks for RAG
-- ============================================================

CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID NOT NULL,
    repository_version_id UUID NOT NULL,

    chunk_index INTEGER NOT NULL,

    content TEXT NOT NULL,
    content_hash VARCHAR(64),

    token_count INTEGER,

    heading_path TEXT,

    start_line INTEGER,
    end_line INTEGER,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT document_chunks_document_fk
        FOREIGN KEY (document_id)
        REFERENCES documents(id)
        ON DELETE CASCADE,

    CONSTRAINT document_chunks_repository_version_fk
        FOREIGN KEY (repository_version_id)
        REFERENCES repository_versions(id)
        ON DELETE CASCADE,

    CONSTRAINT document_chunks_document_index_unique
        UNIQUE (document_id, chunk_index)
);


CREATE INDEX idx_document_chunks_document_id
    ON document_chunks(document_id);


CREATE INDEX idx_document_chunks_repository_version_id
    ON document_chunks(repository_version_id);


CREATE INDEX idx_document_chunks_content_hash
    ON document_chunks(content_hash);


CREATE INDEX idx_document_chunks_metadata
    ON document_chunks
    USING GIN(metadata);


-- ============================================================
-- EMBEDDINGS
-- pgvector
--
-- IMPORTANT:
-- Change 1536 below if your embedding model uses
-- a different vector dimension.
-- ============================================================

CREATE TABLE chunk_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    chunk_id UUID NOT NULL,

    embedding_model VARCHAR(255) NOT NULL,

    embedding VECTOR(768) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chunk_embeddings_chunk_fk
        FOREIGN KEY (chunk_id)
        REFERENCES document_chunks(id)
        ON DELETE CASCADE,

    CONSTRAINT chunk_embeddings_chunk_model_unique
        UNIQUE (chunk_id, embedding_model)
);


CREATE INDEX idx_chunk_embeddings_chunk_id
    ON chunk_embeddings(chunk_id);


-- ============================================================
-- VECTOR INDEX
-- HNSW is recommended for pgvector similarity search
-- ============================================================

CREATE INDEX idx_chunk_embeddings_vector
    ON chunk_embeddings
    USING hnsw (embedding vector_cosine_ops);


-- ============================================================
-- SYNC JOBS
-- Tracks ingestion of Git repositories
-- ============================================================

CREATE TABLE sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    repository_id UUID NOT NULL,

    status VARCHAR(50) NOT NULL,

    commit_sha VARCHAR(64),

    files_discovered INTEGER NOT NULL DEFAULT 0,
    files_processed INTEGER NOT NULL DEFAULT 0,
    chunks_created INTEGER NOT NULL DEFAULT 0,
    embeddings_created INTEGER NOT NULL DEFAULT 0,

    error_message TEXT,

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT sync_jobs_repository_fk
        FOREIGN KEY (repository_id)
        REFERENCES repositories(id)
        ON DELETE CASCADE,

    CONSTRAINT sync_jobs_status_check
        CHECK (
            status IN (
                'pending',
                'running',
                'completed',
                'failed'
            )
        )
);


CREATE INDEX idx_sync_jobs_repository_id
    ON sync_jobs(repository_id);


CREATE INDEX idx_sync_jobs_status
    ON sync_jobs(status);


CREATE INDEX idx_sync_jobs_created_at
    ON sync_jobs(created_at DESC);


-- ============================================================
-- USERS
-- Optional
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(320) NOT NULL,
    name VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_email_unique
        UNIQUE (email)
);


-- ============================================================
-- RAG QUERIES
-- Stores questions asked by users
-- ============================================================

CREATE TABLE rag_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    query TEXT NOT NULL,

    repository_id UUID,
    user_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT rag_queries_repository_fk
        FOREIGN KEY (repository_id)
        REFERENCES repositories(id)
        ON DELETE SET NULL,

    CONSTRAINT rag_queries_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


CREATE INDEX idx_rag_queries_repository_id
    ON rag_queries(repository_id);


CREATE INDEX idx_rag_queries_user_id
    ON rag_queries(user_id);


CREATE INDEX idx_rag_queries_created_at
    ON rag_queries(created_at DESC);


-- ============================================================
-- RAG QUERY CHUNKS
-- Records which chunks were retrieved for a query
-- ============================================================

CREATE TABLE rag_query_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    query_id UUID NOT NULL,
    chunk_id UUID NOT NULL,

    similarity_score DECIMAL,
    retrieval_rank INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT rag_query_chunks_query_fk
        FOREIGN KEY (query_id)
        REFERENCES rag_queries(id)
        ON DELETE CASCADE,

    CONSTRAINT rag_query_chunks_chunk_fk
        FOREIGN KEY (chunk_id)
        REFERENCES document_chunks(id)
        ON DELETE CASCADE,

    CONSTRAINT rag_query_chunks_query_chunk_unique
        UNIQUE (query_id, chunk_id)
);


CREATE INDEX idx_rag_query_chunks_query_id
    ON rag_query_chunks(query_id);


CREATE INDEX idx_rag_query_chunks_chunk_id
    ON rag_query_chunks(chunk_id);


CREATE INDEX idx_rag_query_chunks_rank
    ON rag_query_chunks(query_id, retrieval_rank);


-- ============================================================
-- FULL TEXT SEARCH
-- Useful alongside vector search for technical terms,
-- API endpoints, class names, error codes, etc.
-- ============================================================

ALTER TABLE document_chunks
ADD COLUMN search_vector TSVECTOR
GENERATED ALWAYS AS (
    to_tsvector('english', content)
) STORED;


CREATE INDEX idx_document_chunks_search_vector
    ON document_chunks
    USING GIN(search_vector);


-- ============================================================
-- UPDATED_AT TRIGGER
-- Automatically updates repositories.updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


CREATE TRIGGER repositories_updated_at
BEFORE UPDATE ON repositories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE documents
ADD CONSTRAINT documents_version_path_unique
UNIQUE (repository_version_id, path);