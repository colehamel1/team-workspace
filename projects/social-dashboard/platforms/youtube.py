"""YouTube: subscribers, recent videos, views, watch time. Read-only."""
import re
from datetime import date, timedelta

import requests

TOKEN_URL = "https://oauth2.googleapis.com/token"
API = "https://www.googleapis.com/youtube/v3"
ANALYTICS = "https://youtubeanalytics.googleapis.com/v2/reports"
MAX_POSTS = 100           # most recent uploads to track
SHORT_MAX_SECONDS = 180   # YouTube Shorts can be up to 3 minutes
KEYS = ("YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN")


def is_configured(env):
    return all(env.get(k) for k in KEYS)


def _access_token(env):
    r = requests.post(TOKEN_URL, timeout=30, data={
        "client_id": env["YT_CLIENT_ID"], "client_secret": env["YT_CLIENT_SECRET"],
        "refresh_token": env["YT_REFRESH_TOKEN"], "grant_type": "refresh_token"})
    if r.status_code != 200:
        reason = r.json().get("error", r.status_code) if r.headers.get("content-type", "").startswith("application/json") else r.status_code
        raise RuntimeError(f"YouTube login didn't work ({reason}). Fix: run  py connect_youtube.py")
    return r.json()["access_token"]


def _get(url, token, **params):
    r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, params=params, timeout=30)
    if r.status_code != 200:
        try:
            msg = r.json()["error"]["message"]
        except Exception:
            msg = r.text[:200]
        raise RuntimeError(f"YouTube said {r.status_code}: {msg}")
    return r.json()


def _seconds(duration):
    m = re.fullmatch(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", duration or "")
    if not m:
        return None
    d, h, mi, s = (int(x or 0) for x in m.groups())
    return d * 86400 + h * 3600 + mi * 60 + s


def fetch(env, today=None):
    today = today or date.today()
    token = _access_token(env)
    warnings = []

    ch = _get(f"{API}/channels", token, part="snippet,statistics,contentDetails", mine="true")
    if not ch.get("items"):
        raise RuntimeError("This login has no YouTube channel. Run  py connect_youtube.py  "
                           "and pick the Behind the Greens channel, not your personal profile.")
    c = ch["items"][0]
    stats = c["statistics"]
    uploads = c["contentDetails"]["relatedPlaylists"]["uploads"]

    ids, page = [], None
    while len(ids) < MAX_POSTS:
        params = {"part": "contentDetails", "playlistId": uploads, "maxResults": 50}
        if page:
            params["pageToken"] = page
        d = _get(f"{API}/playlistItems", token, **params)
        ids += [i["contentDetails"]["videoId"] for i in d.get("items", [])]
        page = d.get("nextPageToken")
        if not page:
            break
    ids = ids[:MAX_POSTS]

    videos = []
    for i in range(0, len(ids), 50):
        d = _get(f"{API}/videos", token, part="snippet,statistics,contentDetails", id=",".join(ids[i:i + 50]))
        videos += d.get("items", [])

    # Per-video lifetime numbers YouTube only gives through Analytics.
    per_video = {}
    try:
        rep = _get(ANALYTICS, token, ids="channel==MINE", startDate="2005-01-01",
                   endDate=today.isoformat(), dimensions="video", sort="-views", maxResults=200,
                   metrics="views,estimatedMinutesWatched,averageViewDuration,shares")
        for row in rep.get("rows") or []:
            per_video[row[0]] = row
    except RuntimeError as e:
        warnings.append(f"Watch-time details skipped: {e}")

    # Analytics runs ~2 days behind, so "last 7 days" = the latest 7 complete days.
    views_7d = None
    try:
        end = today - timedelta(days=2)
        rep = _get(ANALYTICS, token, ids="channel==MINE", metrics="views",
                   startDate=(end - timedelta(days=6)).isoformat(), endDate=end.isoformat())
        rows = rep.get("rows") or []
        views_7d = int(rows[0][0]) if rows else 0
    except RuntimeError as e:
        warnings.append(f"7-day views skipped: {e}")

    posts = []
    for v in videos:
        vid, s = v["id"], v.get("statistics", {})
        secs = _seconds(v.get("contentDetails", {}).get("duration"))
        fmt = "short" if secs is not None and secs <= SHORT_MAX_SECONDS else "long"
        a = per_video.get(vid)
        posts.append({
            "platform": "youtube", "post_id": vid,
            "url": f"https://www.youtube.com/{'shorts/' + vid if fmt == 'short' else 'watch?v=' + vid}",
            "published_at": v["snippet"]["publishedAt"], "format": fmt,
            "caption_snippet": v["snippet"]["title"][:80],
            "views": int(s["viewCount"]) if "viewCount" in s else None,
            "likes": int(s["likeCount"]) if "likeCount" in s else None,
            "comments": int(s["commentCount"]) if "commentCount" in s else None,
            "shares": int(a[4]) if a else None,
            "saves": None,
            "watch_min": int(a[2]) if a else None,
            "avg_view_sec": float(a[3]) if a else None,
        })

    account = {
        "platform": "youtube", "account_id": c["id"], "name": c["snippet"]["title"],
        "followers": None if stats.get("hiddenSubscriberCount") else int(stats.get("subscriberCount", 0)),
        "total_views": int(stats.get("viewCount", 0)), "views_7d": views_7d,
    }
    return {"account": account, "posts": posts, "warnings": warnings}
