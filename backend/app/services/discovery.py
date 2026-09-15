from pathlib import Path


def discover_markdown_files(
    repository_path: Path,
):
    files = []

    for path in repository_path.rglob("*"):
        if not path.is_file():
            continue

        if path.suffix.lower() != ".md":
            continue

        relative_path = path.relative_to(
            repository_path
        )

        content = path.read_text(
            encoding="utf-8"
        )

        files.append({
            "path": relative_path.as_posix(),
            "filename": path.name,
            "content": content,
            "file_size": path.stat().st_size,
        })

    return files

def extract_title(
    content: str,
) -> str | None:
    for line in content.splitlines():
        line = line.strip()

        if line.startswith("# "):
            return line[2:].strip()

    return None
