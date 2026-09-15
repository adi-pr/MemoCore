from uuid import UUID

from app.db.supabase import get_supabase

def create_repository(
    provider: str,
    external_id: str | None,
    name: str,
    full_name: str,
    clone_url: str,
    default_branch: str,
):
    supabase = get_supabase()

    response = (
        supabase
        .table("repositories")
        .insert({
            "provider": provider,
            "external_id": external_id,
            "name": name,
            "full_name": full_name,
            "clone_url": clone_url,
            "default_branch": default_branch,
        })
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            "Failed to create repository"
        )

    return response.data[0]

def get_repositories():
    supabase = get_supabase()

    response = (
        supabase
        .table("repositories")
        .select("*")
        .order(
            "created_at",
            desc=True,
        )
        .execute()
    )

    return response.data

def get_repository(
    repository_id: UUID,
):
    supabase = get_supabase()

    response = (
        supabase
        .table("repositories")
        .select("*")
        .eq(
            "id",
            str(repository_id),
        )
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]

def update_repository(
    repository_id: UUID,
    name: str | None = None,
    default_branch: str | None = None,
    is_active: bool | None = None,
):
    supabase = get_supabase()

    updates = {}

    if name is not None:
        updates["name"] = name

    if default_branch is not None:
        updates["default_branch"] = default_branch

    if is_active is not None:
        updates["is_active"] = is_active

    if not updates:
        return get_repository(repository_id)

    response = (
        supabase
        .table("repositories")
        .update(updates)
        .eq(
            "id",
            str(repository_id),
        )
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]

def deactivate_repository(
    repository_id: UUID,
):
    supabase = get_supabase()

    response = (
        supabase
        .table("repositories")
        .update({
            "is_active": False,
        })
        .eq(
            "id",
            str(repository_id),
        )
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]

def get_repository_by_full_name(
    provider: str,
    full_name: str,
):
    supabase = get_supabase()

    response = (
        supabase
        .table("repositories")
        .select("*")
        .eq(
            "provider",
            provider,
        )
        .eq(
            "full_name",
            full_name,
        )
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]
