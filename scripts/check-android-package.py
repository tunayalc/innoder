"""Verify compiled 64-bit ELF libraries using pyelftools, not filename heuristics."""
import io
import sys
import zipfile
from elftools.elf.elffile import ELFFile


def check(filename):
    checked = 0
    failures = []
    with zipfile.ZipFile(filename) as archive:
        for name in archive.namelist():
            if not name.startswith(("lib/arm64-v8a/", "lib/x86_64/")) or not name.endswith(".so"):
                continue
            checked += 1
            elf = ELFFile(io.BytesIO(archive.read(name)))
            loads = [segment for segment in elf.iter_segments() if segment["p_type"] == "PT_LOAD"]
            if not loads or any(segment["p_align"] < 16384 for segment in loads):
                failures.append(name)
    if not checked:
        raise SystemExit("No 64-bit native libraries found; inspect the package before publishing.")
    if failures:
        raise SystemExit("Libraries without 16 KB ELF alignment:\n" + "\n".join(failures))
    print(f"Verified 16 KB ELF alignment for {checked} native libraries.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: check-android-package.py release.apk")
    check(sys.argv[1])
