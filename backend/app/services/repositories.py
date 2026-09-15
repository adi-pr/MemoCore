from uuid import UUID
import httpx

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
    github_url = (
        f"https://api.github.com/repos/{data.full_name}"
    )

    response = httpx.get(
        github_url,
        timeout=10.0,
    )

    if response.status_code == 404:
        raise ValueError(
            "GitHub repository not found"
        )

    if response.status_code != 200:
        raise ValueError(
            "Failed to fetch repository from GitHub"
        )

    github_repo = response.json()

    # Use canonical data from GitHub
    provider = "github"
    external_id = str(github_repo["id"])
    name = github_repo["name"]
    full_name = github_repo["full_name"]
    clone_url = github_repo["clone_url"]
    default_branch = github_repo["default_branch"]

    # Check if repository already exists
    existing = db_get_repository_by_full_name(
        provider=provider,
        full_name=full_name,
    )

    if existing:
        raise ValueError(
            "Repository already exists"
        )

    # Save repository in Supabase
    return db_create_repository(
        provider=provider,
        external_id=external_id,
        name=name,
        full_name=full_name,
        clone_url=clone_url,
        default_branch=default_branch,
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
