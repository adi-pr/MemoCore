import subprocess
from pathlib import Path


def clone_repository(
    clone_url: str,
    destination: Path,
    branch: str,
):
    subprocess.run(
        [
            "git",
            "clone",
            "--branch",
            branch,
            "--single-branch",
            clone_url,
            str(destination),
        ],
        check=True,
        capture_output=True,
        text=True,
    )

    return destination


def get_commit_sha(
    repository_path: Path,
) -> str:
    result = subprocess.run(
        [
            "git",
            "-C",
            str(repository_path),
            "rev-parse",
            "HEAD",
        ],
        check=True,
        capture_output=True,
        text=True,
    )

    return result.stdout.strip()


def get_commit_message(
    repository_path: Path,
) -> str:
    result = subprocess.run(
        [
            "git",
            "-C",
            str(repository_path),
            "log",
            "-1",
            "--pretty=%B",
        ],
        check=True,
        capture_output=True,
        text=True,
    )

    return result.stdout.strip()
