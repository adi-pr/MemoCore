import hashlib
import re
from dataclasses import dataclass

import tiktoken

from app.core.config import get_settings

settings = get_settings()

@dataclass
class Chunk:
    content: str
    chunk_index: int
    token_count: int
    heading_path: int
    start_line: int
    end_line: int
    content_hash: str

def get_encoder():
    return tiktoken.get_encoding("o200k_base")

# def get_encoder():
#     return tiktoken.encoding_for_model(
#         settings.llm_model
#     )

def count_tokens(text: str, encoder) -> int:
    return len(encoder.encode(text))

def hash_content(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()

def extract_heading(line: str):
    match = re.match(
        r"^(#{1,6})\s+(.+?)\s*$",
        line,
    )

    if not match: 
        return None

    level = len(match.group(1))
    title = match.group(2).strip()

    return level, title

def chunk_document(content: str) -> list[Chunk]:
    encoder = get_encoder()

    lines = content.splitlines()

    chunks: list[Chunk] = []

    heading_stack: list[tuple[int, str]] = []

    current_lines: list[str] = []
    current_start_line = 1
    current_heading_path: str | None = None

    chunk_index = 0

    def flush():
        nonlocal current_lines
        nonlocal current_start_line
        nonlocal chunk_index

        if not current_lines:
            return

        chunk_content = "\n".join(
            current_lines
        ).strip()

        token_count = count_tokens(chunk_content, encoder)

        chunks.append(
            Chunk(
                content=chunk_content,
                chunk_index=chunk_index,
                token_count=token_count,
                heading_path=current_heading_path,
                start_line=current_start_line,
                end_line=(
                    current_start_line
                    + len(current_lines)
                    - 1
                ),
                content_hash=hash_content(chunk_content),
            )
        )

        chunk_index += 1
        current_lines = []

    for line_number, line in enumerate(lines, start=1):

        heading = extract_heading(line)

        if heading:
            level, title = heading

            flush()

            # Remove Headings at the same or deeper level
            while (heading_stack and heading_stack[-1][0] >= level):
                heading_stack.pop()

            heading_stack.append((level, title))

            current_heading_path = (
                " > ".join(
                    title
                    for _, title
                    in heading_stack
                )
            )

            current_lines = [line]
            current_start_line = line_number

            continue

        if not current_lines:
            current_start_line = line_number

        current_lines.append(line)

        token_count = count_tokens("\n".join(current_lines), encoder)

        if token_count >= settings.chunk_size:
            flush()

            current_start_line = (line_number + 1)

    flush()

    return chunks