from app.db.repositories.repositories import with_latest_sync_job


def test_with_latest_sync_job_takes_the_embedded_job():
    job = {"id": "job-1", "status": "completed"}

    result = with_latest_sync_job(
        {"id": "repo-1", "sync_jobs": [job]}
    )

    assert result == {"id": "repo-1", "latest_sync_job": job}


def test_with_latest_sync_job_is_none_without_jobs():
    assert with_latest_sync_job(
        {"id": "repo-1", "sync_jobs": []}
    ) == {"id": "repo-1", "latest_sync_job": None}

    assert with_latest_sync_job(
        {"id": "repo-1"}
    ) == {"id": "repo-1", "latest_sync_job": None}


def test_with_latest_sync_job_does_not_mutate_the_row():
    row = {"id": "repo-1", "sync_jobs": []}

    with_latest_sync_job(row)

    assert "sync_jobs" in row
