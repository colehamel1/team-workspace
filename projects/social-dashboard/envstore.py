"""Reads and updates the workspace .env file (the ONLY place keys live).

Never prints values. Writes go to .env.tmp first, then swap in, so a crash
can't leave a half-written .env.
"""
import os
from pathlib import Path

ENV_PATH = Path(__file__).resolve().parents[2] / ".env"  # team-workspace/.env


def read(path=ENV_PATH):
    values = {}
    if not Path(path).exists():
        return values
    for line in Path(path).read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        values[key.strip()] = val.strip().strip('"').strip("'")
    return values


def update(key, value, path=ENV_PATH):
    path = Path(path)
    lines = path.read_text(encoding="utf-8-sig").splitlines() if path.exists() else []
    out, found = [], False
    for line in lines:
        if line.strip().startswith(f"{key}="):
            out.append(f"{key}={value}")
            found = True
        else:
            out.append(line)
    if not found:
        out.append(f"{key}={value}")
    tmp = path.with_name(".env.tmp")
    tmp.write_text("\n".join(out) + "\n", encoding="utf-8")
    os.replace(tmp, path)
