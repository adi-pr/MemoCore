from pydantic import AliasChoices, BaseModel, Field


class AskRequest(BaseModel):
    question: str = Field(min_length=1)
    # The frontend sends this as knowledge_base_id.
    repository_id: str | None = Field(
        default=None,
        validation_alias=AliasChoices("repository_id", "knowledge_base_id"),
    )
    top_k: int = Field(default=5, ge=1, le=50)
