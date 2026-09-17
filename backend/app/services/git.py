import os
import subprocess
from pathlib import Path

def to_github_ssh_url(clone_url: str) -> str:
    clone_url = clone_url.strip()

    if clone_url.startswith("git@github.com:"):
        return clone_url

    prefix = "https://github.com/"

    if clone_url.startswith(prefix):
        path = clone_url[len(prefix):]

        if not path.endswith(".git"):
            path += ".git"

        return f"git@github.com:{path}"

    raise ValueError(f"Unsupported GitHub URL: {clone_url}")


def clone_repository(
    clone_url: str,
    destination: Path,
    branch: str,
):
    key_path = os.getenv(
        "GITHUB_DEPLOY_KEY_PATH",
        os.path.expanduser("~/.ssh/memo_deploy_key"),
    )

    if not os.path.isfile(key_path):
        raise RuntimeError(
            f"GitHub deploy key not found: {key_path}"
        )

    ssh_url = to_github_ssh_url(clone_url)

    env = os.environ.copy()
    env["GIT_SSH_COMMAND"] = (
        f"ssh "
        f"-i {key_path} "
        f"-o IdentitiesOnly=yes "
        f"-o StrictHostKeyChecking=accept-new "
        f"-o BatchMode=yes"
    )

    subprocess.run(
        [
            "git",
            "clone",
            "--branch",
            branch,
            "--single-branch",
            ssh_url,
            str(destination),
        ],
        env=env,
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