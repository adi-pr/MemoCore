from uuid import UUID

from app.db.supabase import get_supabase


def create_repository_version(
    repository_id: UUID,
    commit_sha: str,
    branch: str | None,
    commit_message: str | None,
):
    supabase = get_supabase()

    response = (
        supabase
        .table("repository_versions")
        .insert({
            "repository_id": str(repository_id),
            "commit_sha": commit_sha,
            "branch": branch,
            "commit_message": commit_message,
        })
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            "Failed to create repository version"
        )

    return response.data[0]

def get_repository_version(
    repository_id: UUID,
    commit_sha: str,
):
    supabase = get_supabase()

    response = (
        supabase
        .table("repository_versions")
        .select("*")
        .eq(
            "repository_id",
            str(repository_id),
        )
        .eq(
            "commit_sha",
            commit_sha,
        )
        .limit(1)
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]

