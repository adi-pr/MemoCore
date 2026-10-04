from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

REPOSITORY_ID = "00000000-0000-0000-0000-000000000001"

repository = {
    "id": REPOSITORY_ID,
    "provider": "github",
    "external_id": None,
    "name": "wiki",
    "full_name": "me/wiki",
    "clone_url": "git@github.com:me/wiki.git",
    "default_branch": "main",
    "is_active": True,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z",
}

sync_job = {
    "id": "00000000-0000-0000-0000-000000000002",
    "repository_id": REPOSITORY_ID,
    "status": "completed",
    "commit_sha": "abc123",
    "files_discovered": 3,
    "files_processed": 3,
    "chunks_created": 10,
    "embeddings_created": 10,
    "error_message": None,
    "started_at": "2026-01-01T00:00:00Z",
    "completed_at": "2026-01-01T00:01:00Z",
    "created_at": "2026-01-01T00:00:00Z",
}


def test_list_includes_latest_sync_job():
    rows = [
        {**repository, "latest_sync_job": sync_job},
        {**repository, "id": "00000000-0000-0000-0000-000000000003",
         "latest_sync_job": None},
    ]

    with patch(
        "app.services.repositories.db_get_repositories",
        return_value=rows,
    ):
        response = client.get("/repositories")

    assert response.status_code == 200
    body = response.json()
    assert body[0]["latest_sync_job"]["status"] == "completed"
    assert body[1]["latest_sync_job"] is None


def test_created_repository_has_no_sync_job_yet():
    with (
        patch(
            "app.services.repositories.db_get_repository_by_full_name",
            return_value=None,
        ),
        patch(
            "app.services.repositories.db_create_repository",
            return_value={**repository, "latest_sync_job": None},
        ),
    ):
        response = client.post(
            "/repositories",
            json={
                "name": "wiki",
                "full_name": "me/wiki",
                "clone_url": "https://github.com/me/wiki",
            },
        )

    assert response.status_code == 201
    assert response.json()["latest_sync_job"] is None


def test_unknown_sync_status_is_rejected():
    rows = [
        {**repository, "latest_sync_job": {**sync_job, "status": "weird"}},
    ]

    with patch(
        "app.services.repositories.db_get_repositories",
        return_value=rows,
    ):
        try:
            client.get("/repositories")
        except Exception as exc:
            assert "status" in str(exc)
        else:
            raise AssertionError("expected a validation error")
