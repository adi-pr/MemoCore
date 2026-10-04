from typing import Any

SYSTEM_PROMPT = (
    "You are MemoCore, an assistant that answers questions using the "
    "user's own Markdown knowledge base.\n"
    "Answer using only the context provided. If the context does not "
    "contain the answer, say you could not find it in the knowledge base.\n"
    "Cite the source file path for the facts you use, like [docs/setup.md]."
)


def format_context(chunks: list[dict[str, Any]]) -> str:
    if not chunks:
        return "No relevant context was found."

    sections: list[str] = []

    for index, chunk in enumerate(chunks, start=1):
        source = chunk["file_path"]

        if chunk.get("heading_path"):
            source = f"{source} > {chunk['heading_path']}"

        sections.append(
            f"[{index}] {source}\n{chunk['content']}"
        )

    return "\n\n---\n\n".join(sections)


def build_messages(
    question: str,
    chunks: list[dict[str, Any]],
) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Context:\n\n{format_context(chunks)}\n\n"
                f"Question: {question}"
            ),
        },
    ]
