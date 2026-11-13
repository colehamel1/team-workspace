"""The math behind the dashboard. Uses only Python's built-in tools.

Key idea, "x normal": a post's views divided by the median views of your other
recent posts on the same platform AND the same format (a Reel is compared with
Reels, not carousels). Posts that are too new to judge are left out.
"""
import csv
import json
import statistics
from datetime import datetime
from pathlib import Path

PLATFORMS = ["youtube", "facebook", "instagram", "tiktok"]
PLATFORM_NAMES = {"youtube": "YouTube", "facebook": "Facebook",
                  "instagram": "Instagram", "tiktok": "TikTok"}
PREFIX = {"youtube": "yt", "facebook": "fb", "instagram": "ig", "tiktok": "tt"}

MIN_AGE_DAYS = 7            # a post must be a week old before we judge it
MIN_AGE_DAYS_YT_LONG = 28   # long YouTube videos keep growing for weeks
BASELINE_POSTS = 20         # compare against your last 20 comparable posts
MIN_BASELINE = 5            # need at least 5 to say what "normal" is

TOPICS = ["crew story", "course feature", "gear", "behind-the-scenes", "humor/trend"]
# Words that suggest a topic when guessing tags from a caption. Edit freely.
KEYWORDS = {
    "crew story": ["crew", "superintendent", "meet ", "years", "team"],
    "course feature": ["hole", "course tour", "par ", "bunker", "fairway", "green at"],
    "gear": ["gear", "hoodie", "shirt", "polo", "jacket", "mower shed", "wears"],
    "behind-the-scenes": ["how we", "explained", "agronomy", "process", "rolling", "cups"],
    "humor/trend": ["pov", "when the", "rating", "frost delay", "lol"],
}
TAG_COLUMNS = ["key", "platform", "topic", "format", "tagged_by", "caption_snippet"]


def parse_ts(text):
    return datetime.fromisoformat(text.replace("Z", "+00:00"))


def load_snapshots(folder):
    files = sorted(Path(folder).glob("????-??-??.json"))
    return [json.loads(f.read_text(encoding="utf-8")) for f in files]


def post_key(post):
    return f"{PREFIX[post['platform']]}_{post['post_id']}"


# ---------- topic tags ----------

def load_tags(path):
    path = Path(path)
    if not path.exists():
        return {}
    with open(path, newline="", encoding="utf-8-sig") as fh:
        return {row["key"]: row for row in csv.DictReader(fh) if row.get("key")}


def guess_topic(caption):
    text = (caption or "").lower()
    for topic, words in KEYWORDS.items():
        if any(w in text for w in words):
            return topic
    return ""


def merge_tags(posts, tags):
    """Adds a guessed row for each new post. Never changes a row you already have."""
    added = 0
    for p in posts:
        key = post_key(p)
        if key not in tags:
            tags[key] = {"key": key, "platform": p["platform"],
                         "topic": guess_topic(p.get("caption_snippet")),
                         "format": p.get("format", ""), "tagged_by": "auto",
                         "caption_snippet": (p.get("caption_snippet") or "")[:80]}
            added += 1
    return added


def save_tags(path, tags):
    tmp = Path(str(path) + ".tmp")
    with open(tmp, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=TAG_COLUMNS, extrasaction="ignore")
        w.writeheader()
        for row in sorted(tags.values(), key=lambda r: (r["platform"], r["key"])):
            w.writerow(row)
    tmp.replace(path)


# ---------- the numbers ----------

def min_age(post):
    if post["platform"] == "youtube" and post.get("format") == "long":
        return MIN_AGE_DAYS_YT_LONG
    return MIN_AGE_DAYS


def share_save_rate(p):
    parts = [p.get("shares"), p.get("saves")]
    if not p.get("views") or all(x is None for x in parts):
        return None
    return sum(x or 0 for x in parts) / p["views"]


def compute(snapshots, tags):
    latest = snapshots[-1]
    prev = snapshots[-2] if len(snapshots) > 1 else None
    now = parse_ts(latest["fetched_at"])

    # --- posts ---
    posts = []
    for raw in latest.get("posts", []):
        p = dict(raw)
        p["key"] = post_key(p)
        p["age_days"] = (now - parse_ts(p["published_at"])).total_seconds() / 86400
        tag = tags.get(p["key"], {})
        p["topic"] = (tag.get("topic") or "").strip()
        p["tagged_by"] = tag.get("tagged_by", "")
        p["old_enough"] = p["age_days"] >= min_age(p) and p.get("views") is not None
        p["rate"] = share_save_rate(p)
        posts.append(p)

    for p in posts:
        pool = sorted((q for q in posts if q is not p and q["old_enough"]
                       and q["platform"] == p["platform"] and q.get("format") == p.get("format")),
                      key=lambda q: q["published_at"], reverse=True)[:BASELINE_POSTS]
        p["baseline"] = statistics.median(q["views"] for q in pool) if len(pool) >= MIN_BASELINE else None
        if not p["old_enough"]:
            p["status"] = "too_early"
        elif not p["baseline"]:
            p["status"] = "no_baseline"
        else:
            p["status"] = "ok"
        p["multiple"] = round(p["views"] / p["baseline"], 1) if p["status"] == "ok" else None

    judged = [p for p in posts if p["status"] == "ok"]
    top = sorted(judged, key=lambda p: p["multiple"], reverse=True)[:5]
    bottom = sorted(judged, key=lambda p: p["multiple"])[:5]
    too_early = sorted((p for p in posts if p["status"] == "too_early"),
                       key=lambda p: p["published_at"], reverse=True)

    # --- topic scoreboard: median "x normal" per platform and topic ---
    board = {}
    for t in TOPICS + [""]:
        for pl in PLATFORMS:
            vals = [p["multiple"] for p in judged if p["platform"] == pl and p["topic"] == t]
            board[(t, pl)] = (statistics.median(vals), len(vals)) if vals else (None, 0)
    topic_overall = {}
    for t in TOPICS:
        vals = [p["multiple"] for p in judged if p["topic"] == t]
        topic_overall[t] = (statistics.median(vals), len(vals)) if vals else (None, 0)

    # --- account cards ---
    errors = {e.get("platform"): e.get("message", "") for e in latest.get("errors", [])}
    cards = []
    for pl in PLATFORMS:
        history = []
        for s in snapshots:
            acc = next((a for a in s.get("accounts", []) if a["platform"] == pl), None)
            if acc and acc.get("followers") is not None:
                history.append((s["fetched_at"][:10], acc["followers"]))
        acc = next((a for a in latest.get("accounts", []) if a["platform"] == pl), None)
        prev_acc = next((a for a in (prev or {}).get("accounts", []) if a["platform"] == pl), None)
        delta = None
        if acc and prev_acc and acc.get("followers") is not None and prev_acc.get("followers") is not None:
            delta = acc["followers"] - prev_acc["followers"]
        cards.append({
            "platform": pl, "connected": bool(acc) or bool(history),
            # if this refresh failed, fall back to the last number we had
            "followers": acc.get("followers") if acc else (history[-1][1] if history else None),
            "delta": delta, "prev_date": prev["fetched_at"][:10] if prev else None,
            "views_7d": acc.get("views_7d") if acc else None,
            "history": history,
            "error": errors.get(pl),
            "stale_since": history[-1][0] if (pl in errors and history) else None,
            "posts_30d": sum(1 for p in posts if p["platform"] == pl and p["age_days"] <= 30),
        })

    # --- media kit ---
    kit = []
    for c in cards:
        recent = [p for p in posts if p["platform"] == c["platform"] and p["old_enough"]
                  and p["age_days"] <= 90]
        rates = [p["rate"] for p in recent if p["rate"] is not None]
        kit.append({"platform": c["platform"], "followers": c["followers"],
                    "median_views": statistics.median(p["views"] for p in recent) if recent else None,
                    "share_save_rate": statistics.median(rates) if rates else None,
                    "posts": len(recent)})

    return {
        "fetched_at": latest["fetched_at"], "sample": latest.get("sample", False),
        "snapshot_count": len(snapshots), "cards": cards, "top": top, "bottom": bottom,
        "too_early": too_early, "board": board, "topic_overall": topic_overall,
        "untagged": [p for p in posts if not p["topic"]],
        "auto_tagged": sum(1 for p in posts if p["tagged_by"] == "auto"),
        "kit": kit, "post_count": len(posts),
    }
