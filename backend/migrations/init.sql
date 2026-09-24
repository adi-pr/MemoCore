-- ============================================================
-- MEMO-CORE DATABASE SCHEMA (Supabase / PostgreSQL 15+)
--
-- Git repositories -> Markdown documents -> Chunks -> Embeddings
--
-- Safe to re-run: every statement is idempotent.
-- Run in the Supabase SQL editor or with:
--   psql "$DATABASE_URL" -f migrations/init.sql
-- ============================================================

BEGIN;


-- ============================================================
-- EXTENSIONS
-- Supabase keeps extensions out of the public schema.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;


-- ============================================================
-- HELPERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


-- ============================================================
-- REPOSITORIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    provider VARCHAR(50) NOT NULL,
    external_id VARCHAR(255),

    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(500) NOT NULL,

    clone_url TEXT NOT NULL,
    default_branch VARCHAR(255) NOT NULL DEFAULT 'main',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT repositories_provider_full_name_unique
        UNIQUE (provider, full_name)
);

CREATE OR REPLACE TRIGGER repositories_set_updated_at
    BEFORE UPDATE ON public.repositories
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- REPOSITORY VERSIONS
-- One row per synced Git commit.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.repository_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    repository_id UUID NOT NULL
        REFERENCES public.repositories(id) ON DELETE CASCADE,

    commit_sha VARCHAR(64) NOT NULL,
    branch VARCHAR(255),
    commit_message TEXT,
    committed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Also serves lookups by repository_id.
    CONSTRAINT repository_versions_repo_commit_unique
        UNIQUE (repository_id, commit_sha)
);

CREATE INDEX IF NOT EXISTS idx_repository_versions_commit_sha
    ON public.repository_versions(commit_sha);


-- ============================================================
-- DOCUMENTS
-- One row per Markdown file at a given version.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    repository_id UUID NOT NULL
        REFERENCES public.repositories(id) ON DELETE CASCADE,
    repository_version_id UUID NOT NULL
        REFERENCES public.repository_versions(id) ON DELETE CASCADE,

    path TEXT NOT NULL,
    filename VARCHAR(500) NOT NULL,
    title VARCHAR(500),

    content TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,

    language VARCHAR(50) NOT NULL DEFAULT 'markdown',
    file_size INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Upsert target for the sync worker; also serves lookups by version.
    CONSTRAINT documents_version_path_unique
        UNIQUE (repository_version_id, path)
);

CREATE INDEX IF NOT EXISTS idx_documents_repository_id
    ON public.documents(repository_id);

CREATE INDEX IF NOT EXISTS idx_documents_path
    ON public.documents(path);

CREATE INDEX IF NOT EXISTS idx_documents_content_hash
    ON public.documents(content_hash);

CREATE OR REPLACE TRIGGER documents_set_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- DOCUMENT CHUNKS
-- Documents split into chunks for retrieval.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID NOT NULL
        REFERENCES public.documents(id) ON DELETE CASCADE,
    repository_version_id UUID NOT NULL
        REFERENCES public.repository_versions(id) ON DELETE CASCADE,

    chunk_index INTEGER NOT NULL,

    content TEXT NOT NULL,
    content_hash VARCHAR(64),

    token_count INTEGER,

    heading_path TEXT,

    start_line INTEGER,
    end_line INTEGER,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Postgres full-text search, for exact technical terms
    -- (API names, error codes) alongside vector search.
    search_vector TSVECTOR
        GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Also serves lookups by document_id.
    CONSTRAINT document_chunks_document_index_unique
        UNIQUE (document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_repository_version_id
    ON public.document_chunks(repository_version_id);

CREATE INDEX IF NOT EXISTS idx_document_chunks_content_hash
    ON public.document_chunks(content_hash);

CREATE INDEX IF NOT EXISTS idx_document_chunks_metadata
    ON public.document_chunks USING GIN (metadata);

CREATE INDEX IF NOT EXISTS idx_document_chunks_search_vector
    ON public.document_chunks USING GIN (search_vector);


-- ============================================================
-- CHUNK EMBEDDINGS (pgvector)
--
-- The dimension must match EMBEDDING_DIMENSION in the backend
-- config (768 for nomic-embed-text).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.chunk_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    chunk_id UUID NOT NULL
        REFERENCES public.document_chunks(id) ON DELETE CASCADE,

    embedding_model VARCHAR(255) NOT NULL,

    embedding extensions.VECTOR(768) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Upsert target for the sync worker; also serves lookups by chunk_id.
    CONSTRAINT chunk_embeddings_chunk_model_unique
        UNIQUE (chunk_id, embedding_model)
);

CREATE INDEX IF NOT EXISTS idx_chunk_embeddings_vector
    ON public.chunk_embeddings
    USING hnsw (embedding extensions.vector_cosine_ops);


-- ============================================================
-- SYNC JOBS
-- Tracks ingestion runs for a repository.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    repository_id UUID NOT NULL
        REFERENCES public.repositories(id) ON DELETE CASCADE,

    status VARCHAR(50) NOT NULL DEFAULT 'pending',

    commit_sha VARCHAR(64),

    files_discovered INTEGER NOT NULL DEFAULT 0,
    files_processed INTEGER NOT NULL DEFAULT 0,
    chunks_created INTEGER NOT NULL DEFAULT 0,
    embeddings_created INTEGER NOT NULL DEFAULT 0,

    error_message TEXT,

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT sync_jobs_status_check
        CHECK (status IN ('pending', 'running', 'completed', 'failed'))
);

-- Job history for a repository, newest first.
CREATE INDEX IF NOT EXISTS idx_sync_jobs_repository_created_at
    ON public.sync_jobs(repository_id, created_at DESC);

-- Worker polling for the oldest pending job.
CREATE INDEX IF NOT EXISTS idx_sync_jobs_pending
    ON public.sync_jobs(created_at)
    WHERE status = 'pending';


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(320) NOT NULL,
    name VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT users_email_unique
        UNIQUE (email)
);


-- ============================================================
-- RAG QUERIES
-- Questions asked by users.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rag_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    query TEXT NOT NULL,

    repository_id UUID
        REFERENCES public.repositories(id) ON DELETE SET NULL,
    user_id UUID
        REFERENCES public.users(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rag_queries_repository_id
    ON public.rag_queries(repository_id);

CREATE INDEX IF NOT EXISTS idx_rag_queries_user_id
    ON public.rag_queries(user_id);

CREATE INDEX IF NOT EXISTS idx_rag_queries_created_at
    ON public.rag_queries(created_at DESC);


-- ============================================================
-- RAG QUERY CHUNKS
-- Which chunks were retrieved for each query, and at what rank.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rag_query_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    query_id UUID NOT NULL
        REFERENCES public.rag_queries(id) ON DELETE CASCADE,
    chunk_id UUID NOT NULL
        REFERENCES public.document_chunks(id) ON DELETE CASCADE,

    similarity_score DOUBLE PRECISION,
    retrieval_rank INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT rag_query_chunks_query_chunk_unique
        UNIQUE (query_id, chunk_id)
);

CREATE INDEX IF NOT EXISTS idx_rag_query_chunks_chunk_id
    ON public.rag_query_chunks(chunk_id);

CREATE INDEX IF NOT EXISTS idx_rag_query_chunks_rank
    ON public.rag_query_chunks(query_id, retrieval_rank);


-- ============================================================
-- ROW LEVEL SECURITY
--
-- RLS on with no policies: the anon and authenticated roles
-- (the public API keys) get no access. The backend uses the
-- secret key, which bypasses RLS. Add policies here if a
-- client ever needs direct access.
-- ============================================================

ALTER TABLE public.repositories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repository_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chunk_embeddings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_jobs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_queries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_query_chunks    ENABLE ROW LEVEL SECURITY;


COMMIT;
