# MemoCore Backend

FastAPI service that ingests Markdown from GitHub repositories and serves hybrid search over it.

- **Ingest:** a worker clones a repository over SSH, finds every `.md` file, splits it into heading-aware chunks and embeds each chunk with Ollama.
- **Search:** dense (cosine over embeddings) and sparse (BM25) retrieval run in parallel. Their results are merged and reranked with a cross-encoder.

Data lives in Supabase (Postgres + pgvector). Search scoring runs in Python.

## How search works

```
query ──┬─> embed (Ollama) ─> dense search ─┐
        │                                    ├─> merge by chunk_id ─> cross-encoder rerank ─> top_k
        └────────────────────> BM25 search ──┘
```

Each retriever returns `top_k × RERANK_CANDIDATE_MULTIPLIER` candidates. The reranker (`cross-encoder/ms-marco-MiniLM-L6-v2` by default) scores every candidate against the query and the best `top_k` are returned. The `similarity` field in results is the reranker score, from 0 to 1.

## Requirements

- Python 3.12+ and [uv](https://docs.astral.sh/uv/), or Docker
- A Supabase project (hosted or self-hosted)
- [Ollama](https://ollama.com) with the embedding model pulled: `ollama pull nomic-embed-text`
- A GitHub SSH deploy key with read access to the repositories you want to index

## Setup

### 1. Database

Run [migrations/init.sql](migrations/init.sql) in the Supabase SQL editor, or:

```bash
psql "$DATABASE_URL" -f migrations/init.sql
```

The script is safe to re-run. It enables row-level security on every table with no policies, so only the secret key can read or write. The backend must use that key.

The embedding column is `VECTOR(768)`. If you change embedding model, update the dimension there and `EMBEDDING_DIMENSION` together.

### 2. Configuration

```bash
cp .env.example .env
```

| Variable | Default | Purpose |
|---|---|---|
| `APP_NAME` | `RAG Backend` | Application name. Not used yet |
| `DEBUG` | `false` | Debug flag. Not used yet |
| `SUPABASE_URL` | required | Supabase API URL |
| `SUPABASE_KEY` | required | Supabase **secret** key (`sb_secret_…`) |
| `EMBEDDING_PROVIDER` | `ollama` | Embedding backend. Only `ollama` is supported |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama server for embeddings |
| `LMSTUDIO_HOST` | `http://localhost:1234` | LM Studio server. Not used yet |
| `EMBEDDING_MODEL` | `nomic-embed-text` | Ollama embedding model |
| `EMBEDDING_DIMENSION` | `768` | Must match the model and the database column |
| `LLM_MODEL` | `gpt-4.1-mini` | Model for generated answers. Not used yet |
| `CHUNK_SIZE` | `1000` | Maximum tokens per chunk |
| `CHUNK_OVERLAP` | `200` | Chunk overlap. Not used yet |
| `RETRIEVAL_TOP_K` | `5` | Default result count. Not used yet; searches pass `top_k` |
| `RERANKER_MODEL` | `cross-encoder/ms-marco-MiniLM-L6-v2` | Hugging Face cross-encoder |
| `RERANK_CANDIDATE_MULTIPLIER` | `4` | Candidates per retriever = `top_k ×` this |
| `MODEL_TIMEOUT_SECONDS` | `60` | Timeout for Ollama requests |
| `GITHUB_DEPLOY_KEY_PATH` | `~/.ssh/memo_deploy_key` | SSH key the worker clones with. Read from the shell environment, not `.env`, when running locally; set for you in Docker |
| `SYNC_POLL_SECONDS` | `10` | Docker only: seconds between worker runs |
| `GITHUB_DEPLOY_KEY_FILE` | `~/.ssh/memo_deploy_key` | Docker only: host path of the deploy key |
| `APP_UID` / `APP_GID` | `1000` | Docker only: container user; must own the deploy key |

## Running

### Docker

```bash
docker compose up -d --build
```

This starts two containers from one image:

- `api`: the HTTP API on http://localhost:8000
- `worker`: runs the sync worker every 10 seconds (set `SYNC_POLL_SECONDS` to change)

The deploy key is mounted from `~/.ssh/memo_deploy_key`. Set `GITHUB_DEPLOY_KEY_FILE` to use another path. The image runs as uid 1000 so it can read the key. If your user has a different uid, build with `APP_UID=$(id -u) APP_GID=$(id -g) docker compose build`.

The reranker model downloads on the first search and is cached in the `hf-cache` volume.

### Locally

```bash
uv sync
uv run fastapi dev            # API with reload on :8000
uv run python -m app.worker.sync   # process one pending sync job
```

On Linux, torch installs from PyTorch's CPU-only index (see `[tool.uv.sources]` in `pyproject.toml`).

## Using the API

Interactive docs are at http://localhost:8000/docs.

**1. Add a repository.** Only GitHub is supported. HTTPS URLs are converted to SSH for cloning.

```bash
curl -X POST localhost:8000/repositories \
  -H 'content-type: application/json' \
  -d '{"name": "wiki", "full_name": "me/wiki", "clone_url": "https://github.com/me/wiki", "default_branch": "main"}'
```

**2. Queue a sync.** The worker picks up pending jobs oldest first.

```bash
curl -X POST localhost:8000/repositories/<repository_id>/sync
curl localhost:8000/sync-jobs/<job_id>        # status and progress
```

**3. Search.**

```bash
curl -X POST localhost:8000/search \
  -H 'content-type: application/json' \
  -d '{"query": "how do I deploy?", "top_k": 5, "repository_id": null}'
```

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/repositories` | Add a repository |
| `GET` | `/repositories` | List repositories |
| `GET` | `/repositories/{id}` | Get a repository |
| `PATCH` | `/repositories/{id}` | Update name, branch or active flag |
| `DELETE` | `/repositories/{id}` | Deactivate a repository (soft delete) |
| `POST` | `/repositories/{id}/sync` | Queue a sync job |
| `GET` | `/repositories/{id}/sync-jobs` | List a repository's sync jobs |
| `GET` | `/sync-jobs/{id}` | Get a sync job |
| `POST` | `/search` | Hybrid search with reranking (`top_k` 1–50) |

## Development

```bash
uv sync
uv run pytest
```

Tests mock Ollama and the reranker, so they need no network or database.

### Layout

```
app/
  api/routes/       HTTP endpoints
  core/             settings and logging
  db/repositories/  Supabase queries
  schema/           request and response models
  services/         chunking, embeddings, search, reranker, git
  worker/sync.py    repository ingestion job
migrations/init.sql database schema
tests/
```
