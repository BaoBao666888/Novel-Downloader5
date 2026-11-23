"""Copy only build inputs to WSL while keeping Git in the source checkout."""

import argparse
import filecmp
import json
from pathlib import Path
import shutil
import subprocess
from tempfile import TemporaryDirectory


PREFIX = "rename_chapters/"
FILES = {"LICENSE", *(PREFIX + name for name in (
    ".cargo/config.toml", "icon.ico", "app/__init__.py", "app/paths.py", "app/core/__init__.py",
    "app/core/renamer.py", "app/core/text_ops.py", "rust/Cargo.toml", "rust/Cargo.lock",
    "desktop/.gitignore", "desktop/README.md", "desktop/index.html", "desktop/package.json",
    "desktop/package-lock.json", "desktop/tsconfig.json", "desktop/vite.config.ts",
    "desktop/package-windows.py", "desktop/sync-wsl-build.py",
    "desktop/src-tauri/Cargo.toml", "desktop/src-tauri/Cargo.lock", "desktop/src-tauri/build.rs",
    "desktop/src-tauri/tauri.conf.json", "desktop/src-tauri/tauri.nsis.conf.json",
))}
DIRECTORIES = tuple(PREFIX + name for name in (
    "rust/src/", "rust/tests/", "desktop/src/", "desktop/public/",
    "desktop/src-tauri/src/", "desktop/src-tauri/capabilities/",
))
MANIFEST = ".novel-studio-build-inputs.json"


def allowed(name):
    path = Path(name)
    return (
        not path.is_absolute()
        and ".." not in path.parts
        and (name in FILES or name.startswith(DIRECTORIES))
    )


def sources(repo):
    output = subprocess.check_output(
        ["git", "-C", repo, "ls-files", "-z", "--cached", "--others", "--exclude-standard",
         "--", *sorted(FILES), *DIRECTORIES],
    )
    for name in set(filter(None, output.decode("utf-8").split("\0"))):
        path = repo / name
        if allowed(name) and path.is_file() and not path.is_symlink():
            yield name


def sync(repo, dest):
    if dest.is_relative_to(repo) or (dest / ".git").exists():
        raise ValueError("Choose a separate build directory without a Git repository.")
    dest.mkdir(parents=True, exist_ok=True)
    manifest = dest / MANIFEST
    previous = set(json.loads(manifest.read_text(encoding="utf-8"))) if manifest.exists() else set()
    current = set(sources(repo))

    for name in sorted(current):
        src, target = repo / name, dest / name
        if target.is_file() and filecmp.cmp(src, target, shallow=False):
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, target)

    for name in previous - current:
        if allowed(name):
            (dest / name).unlink(missing_ok=True)

    manifest.write_text(json.dumps(sorted(current), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Synced {len(current)} build inputs to {dest}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--runner-jar", type=Path, help="Stage the locally built vBook runner for NSIS")
    args = parser.parse_args()
    dest = args.destination.expanduser().resolve()
    sync(Path(__file__).resolve().parents[2], dest)
    if args.runner_jar is not None:
        jar = args.runner_jar.expanduser().resolve(strict=True)
        staged = dest / PREFIX / "desktop/src-tauri/runtime/vbook_runner.jar"
        staged.parent.mkdir(parents=True, exist_ok=True)
        if not staged.exists() or not filecmp.cmp(jar, staged, shallow=False):
            with TemporaryDirectory(dir=staged.parent) as temp:
                pending = Path(temp) / staged.name
                shutil.copy2(jar, pending)
                pending.replace(staged)
        print("Staged vbook_runner.jar from the selected local artifact.")
