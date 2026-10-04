from fastapi import FastAPI

from app.api.routes import ask, health, repositories, sync_jobs, search
from app.core.logging import setup_logging

setup_logging()

app = FastAPI(
    title="RAG Backend",
    description="Document RAG API using FastAPI, Supabase, embeddings and an LLM.",
    version="0.1.0",
    # Operation ids are the route function names, so they must be unique.
    generate_unique_id_function=lambda route: route.name,
)


app.include_router(health.router)
app.include_router(repositories.router, prefix="/repositories")
app.include_router(sync_jobs.router)
app.include_router(search.router, prefix="/search")
app.include_router(ask.router, prefix="/ask")

# app.include_router(documents.router, prefix="/api")
# app.include_router(chat.router, prefix="/api")


@app.get("/", include_in_schema=False)
def root():
    return {
        "name": "RAG Backend",
        "version": "0.1.0",
        "docs": "/docs",
    }