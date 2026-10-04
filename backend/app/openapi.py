"""Print the OpenAPI schema as JSON.

Builds the schema from the app without starting a server or reading
.env, so the frontend can generate types offline:

    uv run python -m app.openapi > openapi.json
"""

import json
import sys

from app.main import app


def main() -> None:
    json.dump(app.openapi(), sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
