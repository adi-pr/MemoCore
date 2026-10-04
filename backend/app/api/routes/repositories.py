from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.schema.repositories import (
    RepositoryCreate,
    RepositoryResponse,
    RepositoryUpdate,
)

from app.services import repositories as repository_service

router = APIRouter(tags=["Repositories"],)

@router.post(
    "",
    response_model=RepositoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_repository(
    data: RepositoryCreate,
):
    try:
        return repository_service.create_repository(data)

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
    return repository_service.get_repositories()

@router.get(
    "/{repository_id}",
    response_model=RepositoryResponse,
)
def get_repository(
    repository_id: UUID,
):
    repository = repository_service.get_repository(
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
def update_repository(
    repository_id: UUID,
    data: RepositoryUpdate,
):
    repository = repository_service.update_repository(
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
def deactivate_repository(
    repository_id: UUID,
):
    repository = repository_service.deactivate_repository(
        repository_id
    )

    if not repository:
        raise HTTPException(
            status_code=404,
            detail="Repository not found",
        )

    return repository
