from uuid import UUID

from app.db.repositories.repositories import (
    create_repository as db_create_repository,
    get_repositories as db_get_repositories,
    get_repository as db_get_repository,
    get_repository_by_full_name as db_get_repository_by_full_name,
    update_repository as db_update_repository,
    deactivate_repository as db_deactivate_repository,
)

from app.schema.repositories import (
    RepositoryCreate,
    RepositoryUpdate,
)

def create_repository(
    data: RepositoryCreate,
):
    existing = db_get_repository_by_full_name(
        provider=data.provider,
        full_name=data.full_name,
    )

    if existing:
        raise ValueError(
            "Repository already exists"
        )

    return db_create_repository(
        provider=data.provider,
        external_id=data.external_id,
        name=data.name,
        full_name=data.full_name,
        clone_url=str(data.clone_url),
        default_branch=data.default_branch,
    )

def get_repositories():
    return db_get_repositories()

def get_repository(
    repository_id: UUID,
):
    return db_get_repository(
        repository_id
    )

def update_repository(
    repository_id: UUID,
    data: RepositoryUpdate,
):
    existing = db_get_repository(
        repository_id
    )

    if not existing:
        return None

    return db_update_repository(
        repository_id=repository_id,
        name=data.name,
        default_branch=data.default_branch,
        is_active=data.is_active,
    )

def deactivate_repository(
    repository_id: UUID,
):
    return db_deactivate_repository(
        repository_id
    )
