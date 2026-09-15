from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl


class RepositoryCreate(BaseModel):
    provider: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )

    external_id: str | None = None

    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )

    full_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )

    clone_url: HttpUrl

    default_branch: str = Field(
        default="main",
        min_length=1,
        max_length=255,
    )


class RepositoryUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    default_branch: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    is_active: bool | None = None


class RepositoryResponse(BaseModel):
    id: UUID

    provider: str
    external_id: str | None

    name: str
    full_name: str

    clone_url: str
    default_branch: str

    is_active: bool

    created_at: datetime
    updated_at: datetime
