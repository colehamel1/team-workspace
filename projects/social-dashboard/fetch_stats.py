"""Pulls fresh stats from every connected platform, saves today's snapshot in
data/, then rebuilds dashboard.html. This is what refresh.bat runs.

If one platform fails, the others still update, and the dashboard marks the
failed one as stale instead of crashing.
"""
import json
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path

import envstore
import metrics as m

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"

SECRET_PATTERN = re.compile(r"(access_token|refresh_token|client_secret|code|token)=[^&\s\"']+", re.I)


def redact(text):
    return SECRET_PATTERN.sub(r"\1=***", str(text))


def load_platforms():
    mods = {}
    try:
        from platforms import youtube
        mods["youtube"] = youtube
    except ImportError as e:  # e.g. requests not installed yet
        sys.exit(f"Missing a helper ({e.name}). Run:  py -m pip install -r requirements.txt")
    return mods


def main():
    env = envstore.read()
    today = date.today()
    snap = {"schema_version": 1,
            "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "accounts": [], "posts": [], "errors": []}

    previous = m.load_snapshots(DATA) if DATA.exists() else []
    connected = 0
    for name, mod in load_platforms().items():
        label = m.PLATFORM_NAMES[name]
        if not mod.is_configured(env):
            print(f"  {label}: not connected yet (skipped)")
            continue
        connected += 1
        try:
            res = mod.fetch(env, today)
            snap["accounts"].append(res["account"])
            snap["posts"] += res["posts"]
            print(f"  {label}: OK ({len(res['posts'])} posts)")
            for w in res.get("warnings", []):
                print(f"    note: {redact(w)}")
        except Exception as e:  # keep going; show it as stale on the dashboard
            msg = redact(e)
            snap["errors"].append({"platform": name, "message": msg})
            print(f"  {label}: FAILED. {msg}")
            # Keep showing last time's posts for this platform.
            if previous:
                snap["posts"] += [p for p in previous[-1].get("posts", []) if p["platform"] == name]

    if not connected:
        sys.exit("No platforms connected yet. Start with CONNECT_YOUTUBE.md.")

    DATA.mkdir(exist_ok=True)
    out = DATA / f"{today.isoformat()}.json"  # a second refresh on the same day replaces the first
    tmp = out.with_suffix(".tmp")
    tmp.write_text(json.dumps(snap, indent=1), encoding="utf-8")
    tmp.replace(out)
    print(f"Saved {out.name}")

    import build_dashboard
    sys.argv = [sys.argv[0]]
    build_dashboard.main()


if __name__ == "__main__":
    main()
