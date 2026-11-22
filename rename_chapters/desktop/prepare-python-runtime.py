"""Stage a verified CPython embeddable distribution for the Windows installer."""

import hashlib
import io
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import urllib.request
from zipfile import ZipFile


VERSION = "3.14.10"
SHA256 = "90905e64a840557d8c1bc4f5b74db3d7ee85e3ffb217611cac1c7813acea4159"
ARCHIVE = f"python-{VERSION}-embed-amd64.zip"
URL = f"https://www.python.org/ftp/python/{VERSION}/{ARCHIVE}"
TAURI = Path(__file__).resolve().parent / "src-tauri"


def verified_archive(cache):
    if cache.is_file():
        data = cache.read_bytes()
    else:
        with urllib.request.urlopen(URL, timeout=90) as response:
            data = response.read()
    if hashlib.sha256(data).hexdigest() != SHA256:
        raise RuntimeError(f"SHA-256 mismatch for {ARCHIVE}")
    if not cache.is_file():
        with TemporaryDirectory(dir=cache.parent) as temp:
            archive = Path(temp) / ARCHIVE
            archive.write_bytes(data)
            archive.replace(cache)
    return data


def stage_runtime():
    relative_path = f"runtime/python-{VERSION}/"
    options = json.loads((TAURI / "tauri.nsis.conf.json").read_text(encoding="utf-8"))
    if options["bundle"]["resources"].get(relative_path) != "runtime/python/":
        raise RuntimeError("The NSIS resource mapping must match the verified Python version")

    destination = TAURI / relative_path
    cache = destination.parent / "downloads" / ARCHIVE
    cache.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(io.BytesIO(verified_archive(cache))) as source:
        files = source.namelist()
        if destination.is_dir():
            if {path.name for path in destination.iterdir()} != set(files) or any(
                (destination / name).read_bytes() != source.read(name) for name in files
            ):
                raise RuntimeError(f"Staged runtime differs from the official archive in {relative_path}")
        else:
            with TemporaryDirectory(dir=destination.parent) as temp:
                staged = Path(temp) / "python"
                source.extractall(staged)
                staged.rename(destination)
    print(f"CPython {VERSION} x64 verified and staged for NSIS.")


def require_runner():
    runner = TAURI / "runtime/vbook_runner.jar"
    if not runner.is_file():
        raise RuntimeError("Stage vbook_runner.jar using sync-wsl-build.py --runner-jar before packaging.")
    with ZipFile(runner) as archive:
        manifest = archive.read("META-INF/MANIFEST.MF")
        main = next((line.split(b":", 1)[1].strip() for line in manifest.splitlines()
                     if line.startswith(b"Main-Class:")), b"")
        if not main or main.replace(b".", b"/").decode("ascii") + ".class" not in archive.namelist():
            raise RuntimeError("The staged vbook_runner.jar must be an executable JAR.")
        if "vbook/BrowserBridgeClient.class" not in archive.namelist():
            raise RuntimeError("The staged vbook_runner.jar must support the browser bridge.")
    print("Staged vBook runner is ready.")


if __name__ == "__main__":
    require_runner()
    stage_runtime()
