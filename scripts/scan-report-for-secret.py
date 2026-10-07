#!/usr/bin/env python3
"""Fail if a secret appears anywhere in Playwright output that CI uploads or publishes.

usage: SCAN_SECRET=<value> scan-report-for-secret.py <dir> [<dir> ...]

Exit 0 = secret absent, 1 = found, 2 = misuse (no secret given). Directories that do not exist
are skipped. Prints WHERE it found the secret, never the secret itself.

Why this exists: the HTML report keeps its data in a base64 zip inside index.html, so grepping the
report folder does not see it. That is where Playwright's recorded API-client step errors landed,
call log and request headers included, and CI publishes the report to a public GitHub Pages site.
The secret is read from the environment, not argv, so it does not show up in a process listing.
"""
import base64
import io
import os
import re
import sys
import zipfile
from pathlib import Path

MAX_ZIP_DEPTH = 3
EMBEDDED_REPORT = re.compile(
    r'id="playwrightReportBase64"[^>]*>\s*data:application/zip;base64,([A-Za-z0-9+/=]+)'
)


def scan_zip(data: bytes, needle: bytes, label: str, depth: int = 0) -> list[str]:
    """Names of zip members (recursing into nested zips) whose bytes contain the needle."""
    hits: list[str] = []
    try:
        archive = zipfile.ZipFile(io.BytesIO(data))
    except zipfile.BadZipFile:
        return hits
    with archive:
        for name in archive.namelist():
            member = archive.read(name)
            if needle in member:
                hits.append(f"{label} -> {name}")
            elif depth < MAX_ZIP_DEPTH and member[:2] == b"PK":
                hits.extend(scan_zip(member, needle, f"{label} -> {name}", depth + 1))
    return hits


def scan_file(path: Path, needle: bytes) -> list[str]:
    data = path.read_bytes()
    hits: list[str] = []
    if needle in data:
        hits.append(f"{path} (plain text)")
    if path.suffix == ".zip" or data[:2] == b"PK":
        hits.extend(scan_zip(data, needle, f"{path} (zip)"))
    embedded = EMBEDDED_REPORT.search(data.decode("utf-8", errors="replace"))
    if embedded:
        hits.extend(
            scan_zip(base64.b64decode(embedded.group(1)), needle, f"{path} (embedded report data)")
        )
    return hits


def main(argv: list[str]) -> int:
    secret = os.environ.get("SCAN_SECRET", "")
    if not secret:
        # An empty needle matches everything and a missing one would call every report clean.
        print("SCAN_SECRET is not set; refusing to report a clean scan", file=sys.stderr)
        return 2

    needle = secret.encode()
    hits: list[str] = []
    for arg in argv:
        root = Path(arg)
        if not root.exists():
            continue
        for path in sorted([root] if root.is_file() else root.rglob("*")):
            if path.is_file():
                hits.extend(scan_file(path, needle))

    if hits:
        print("SECRET FOUND in:")
        for hit in hits:
            print(f"  - {hit}")
        return 1
    print("secret absent from: " + ", ".join(argv))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
