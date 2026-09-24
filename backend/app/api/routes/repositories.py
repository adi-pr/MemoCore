from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.schema.repositories import (
    RepositoryCreate,
    RepositoryResponse,
    RepositoryUpdate,
)

from app.services.repositories import (
    create_repository,
    get_repositories,
    get_repository,
    update_repository,
    deactivate_repository,
)

router = APIRouter(tags=["Repositories"],)

@router.post(
    "",
    response_model=RepositoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    data: RepositoryCreate,
):
    try:
        return create_repository(data)

    except ValueError as exc:
        raise HTTPException(
            status_code=409,
            detail=str(exc),
        )

@router.get(
    "",
    response_model=list[RepositoryResponse],
)
def list_repositories():
    return get_repositories()

@router.get(
    "/{repository_id}",
    response_model=RepositoryResponse,
)
def get(
    repository_id: UUID,
):
    repository = get_repository(
        repository_id
    )

    if not repository:
        raise HTTPException(
            status_code=404,
            detail="Repository not found",
        )

    return repository

@router.patch(
    "/{repository_id}",
    response_model=RepositoryResponse,
)
def update(
    repository_id: UUID,
    data: RepositoryUpdate,
):
    repository = update_repository(
        repository_id,
        data,
    )

    if not repository:
        raise HTTPException(
            status_code=404,
            detail="Repository not found",
        )

    return repository

@router.delete(
    "/{repository_id}",
    response_model=RepositoryResponse,
)
def delete(
    repository_id: UUID,
):
    repository = deactivate_repository(
        repository_id
    )

    if not repository:
        raise HTTPException(
            status_code=404,
            detail="Repository not found",
        )

    return repository
