# syntax=docker/dockerfile:1

# ------------------------------------------------------------
# Build: resolve dependencies from uv.lock into /app/.venv
# ------------------------------------------------------------
FROM ghcr.io/astral-sh/uv:python3.14-bookworm-slim AS builder

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=0

WORKDIR /app

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-dev --no-install-project


# ------------------------------------------------------------
# Runtime
# ------------------------------------------------------------
FROM python:3.14-slim-bookworm

# git + ssh are needed by the sync worker to clone repositories.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git openssh-client \
    && rm -rf /var/lib/apt/lists/*

# Match the host user's uid so a bind-mounted deploy key (mode 600)
# stays readable inside the container.
ARG APP_UID=1000
ARG APP_GID=1000
RUN groupadd --gid ${APP_GID} app \
    && useradd --uid ${APP_UID} --gid app --create-home app \
    && mkdir -p /home/app/.ssh /home/app/.cache/huggingface \
    && chmod 700 /home/app/.ssh \
    && chown -R app:app /home/app

WORKDIR /app

COPY --from=builder --chown=app:app /app/.venv /app/.venv
COPY --chown=app:app app ./app

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/home/app/.cache/huggingface \
    GITHUB_DEPLOY_KEY_PATH=/run/secrets/github_deploy_key

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
