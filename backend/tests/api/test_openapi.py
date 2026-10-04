from app.main import app


def test_operation_ids_are_route_names():
    operation_ids = {
        operation["operationId"]
        for path in app.openapi()["paths"].values()
        for operation in path.values()
    }

    assert operation_ids == {
        "health_check",
        "list_repositories",
        "create_repository",
        "get_repository",
        "update_repository",
        "deactivate_repository",
        "create_sync_job",
        "list_sync_jobs",
        "get_sync_job",
        "search",
        "ask_stream",
    }
