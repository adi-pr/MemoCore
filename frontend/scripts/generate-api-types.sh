#!/usr/bin/env sh
# Generates lib/api/schema.d.ts from the backend code. The backend builds
# its OpenAPI schema offline, so no server or database is needed.
set -eu

cd "$(dirname "$0")/.."

schema=$(mktemp --suffix=.json)
trap 'rm -f "$schema"' EXIT

uv run --directory ../backend python -m app.openapi > "$schema"
# Fields with a default are optional in request bodies, not required.
npx --no-install openapi-typescript "$schema" -o lib/api/schema.d.ts \
  --default-non-nullable false
