"""The source-agnostic knowledge store: one JSON file (git history) + a live copy in Cloudflare KV.

Shape (designed so podcasts/articles are a new INGEST path into the SAME store, not a second system):
  { "generated_at", "sources":[{id,type,title,url,operator,extracted_at,n_cards,verification,density_note}],
    "cards":[{id, source_id, ...idea fields...}], "applications":[{for,source_id,venture,note}], "clusters":{} }

extract-video upserts one source: it drops that source's prior cards/apps/source row, then appends the new
ones, so re-running a video replaces cleanly. The file is committed; the KV copy is what the team-only web
tab reads live (no redeploy needed to see new cards).
"""
import json
import os
import shutil
import subprocess
import tempfile
from datetime import datetime
from pathlib import Path

import config

_EMPTY = {"generated_at": None, "sources": [], "cards": [], "applications": [], "clusters": {}}


def load():
    f = config.KNOWLEDGE_STORE_FILE
    if f.exists():
        try:
            return json.loads(f.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            # main file unreadable (e.g. a kill mid-write on an old non-atomic save) -> fall back to the
            # last-known-good .bak rather than silently starting empty and re-ingesting everything.
            bak = f.with_suffix(f.suffix + ".bak")
            if bak.exists():
                try:
                    return json.loads(bak.read_text(encoding="utf-8"))
                except (ValueError, OSError):
                    pass
            raise  # both corrupt: fail loudly, never silently return empty over a real store
    return dict(_EMPTY)


def assign_ids(source_id, cards):
    for i, c in enumerate(cards):
        c["id"] = f"{source_id}:{i}"
        c["source_id"] = source_id
    return cards


def upsert_source(store, source, cards, applications, density_note=""):
    sid = source["id"]
    store["sources"] = [s for s in store.get("sources", []) if s.get("id") != sid]
    store["cards"] = [c for c in store.get("cards", []) if c.get("source_id") != sid]
    store["applications"] = [a for a in store.get("applications", []) if a.get("source_id") != sid]
    verification = cards[0].get("verification") if cards else "unknown"
    store["sources"].append({
        "id": sid, "type": source.get("type", "youtube"), "title": source.get("title", ""),
        "url": source.get("url", ""), "operator": source.get("operator", ""),
        "playlist": source.get("playlist", ""),  # provenance metadata only
        "extracted_at": datetime.now().isoformat(timespec="seconds"),
        "n_cards": len(cards), "verification": verification, "density_note": density_note,
    })
    store["cards"].extend(cards)
    for a in applications:
        a["source_id"] = sid
    store["applications"].extend(applications)
    return store


def save(store):
    """ATOMIC per-video save. An 8-hour unattended batch calls this after every video, so a mid-write kill
    (machine sleep, power loss) must NEVER corrupt the store -- that would lose the run AND the pre-existing
    cards. Write to a temp file in the same directory, fsync, then os.replace (atomic on POSIX): the real file
    is only ever swapped whole-for-whole. Also rotate the last good copy to <file>.bak as a second parachute."""
    store["generated_at"] = datetime.now().isoformat(timespec="seconds")
    dest = config.KNOWLEDGE_STORE_FILE
    data = json.dumps(store, indent=2, ensure_ascii=False)
    fd, tmp = tempfile.mkstemp(dir=str(dest.parent), prefix=".store_", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(data)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp, dest)  # atomic swap: dest is ALWAYS a complete file (new one, or untouched prior one)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise
    # dest is now the new good file; refresh the .bak parachute from it (a kill here still leaves dest valid).
    try:
        shutil.copy2(dest, dest.with_suffix(dest.suffix + ".bak"))
    except OSError:
        pass
    return dest


def push_to_kv(log):
    """Push the store to KV so the live team-only tab reads it without a redeploy.
    Uses wrangler with the PROGRESS binding from web/wrangler.toml (key: learning:cards)."""
    web = config.PROJECT_ROOT / "web"
    cmd = ["npx", "wrangler", "kv", "key", "put", "learning:cards",
           "--binding", "PROGRESS", "--path", str(config.KNOWLEDGE_STORE_FILE), "--remote"]
    log.info("  pushing store to KV (learning:cards)...")
    r = subprocess.run(cmd, cwd=str(web), capture_output=True, text=True)
    if r.returncode != 0:
        log.error(f"  KV push failed: {r.stderr.strip() or r.stdout.strip()}")
        return False
    log.info("  KV push ok")
    return True


def kv_get_json(key, log, default=None):
    """Read a KV key (PROGRESS binding) and JSON-parse it. Returns default on miss/parse error."""
    web = config.PROJECT_ROOT / "web"
    cmd = ["npx", "wrangler", "kv", "key", "get", key, "--binding", "PROGRESS", "--remote"]
    r = subprocess.run(cmd, cwd=str(web), capture_output=True, text=True)
    if r.returncode != 0:
        log.warning(f"  KV get '{key}' miss/err: {(r.stderr or r.stdout).strip()[:160]}")
        return {} if default is None else default
    try:
        return json.loads(r.stdout)
    except Exception:  # noqa: BLE001
        return {} if default is None else default


def kv_put_json(key, obj, log):
    """Write a JSON-serializable obj to a KV key (PROGRESS binding) via a temp file."""
    web = config.PROJECT_ROOT / "web"
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False)
        tmp = f.name
    cmd = ["npx", "wrangler", "kv", "key", "put", key, "--binding", "PROGRESS", "--path", tmp, "--remote"]
    r = subprocess.run(cmd, cwd=str(web), capture_output=True, text=True)
    Path(tmp).unlink(missing_ok=True)
    if r.returncode != 0:
        log.error(f"  KV put '{key}' failed: {(r.stderr or r.stdout).strip()[:200]}")
        return False
    return True
