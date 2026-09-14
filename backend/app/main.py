from fastapi import FastAPI

from app.api.routes import health

app = FastAPI(
    title="RAG Backend",
    description="Document RAG API using FastAPI, Supabase, embeddings and an LLM.",
    version="0.1.0",
)


app.include_router(health.router)
# app.include_router(documents.router, prefix="/api")
# app.include_router(chat.router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": "RAG Backend",
        "version": "0.1.0",
        "docs": "/docs",
    }