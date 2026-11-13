"""Makes the FAKE sample numbers used by `py build_dashboard.py --sample`.

Nothing here is real. It exists so the dashboard can be previewed before any
account is connected. Re-run it to regenerate the sample files:

    py sample_data/make_sample_data.py
"""
import csv
import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
NOW = datetime(2026, 11, 13, 14, 0, tzinfo=timezone.utc)
WEEKS = 8
rng = random.Random(42)

CAPTIONS = {
    "crew story": ["Meet Dale, 31 years mowing greens before sunrise",
                   "The crew that gets 18 holes ready by 6am",
                   "Why our superintendent never takes a day off in June"],
    "course feature": ["Hole 7 at first light. Worth the alarm",
                       "Course tour: the par 3 everyone talks about",
                       "This bunker took three weeks to rebuild"],
    "gear": ["What's in the mower shed: the reel mower breakdown",
             "Testing the new hoodie on a 38-degree morning",
             "Gear check: what the crew actually wears"],
    "behind-the-scenes": ["How we cut cups: the full process",
                          "Rolling greens at 5am, explained",
                          "Agronomy 101: why we punch holes in the greens"],
    "humor/trend": ["POV: a golfer asks if the course is 'open yet'",
                    "When the sprinklers come on at the wrong time",
                    "Rating every golfer's divot repair"],
}

# (platform, format, typical views, how many posts)
LINES = [
    ("youtube", "short", 2600, 14),
    ("youtube", "long", 900, 5),
    ("facebook", "video", 1500, 10),
    ("facebook", "photo", 450, 8),
    ("instagram", "reel", 4000, 14),
    ("instagram", "carousel", 1100, 8),
    ("tiktok", "video", 6500, 18),
]
# How each topic tends to perform, so the topic scoreboard tells a story.
TOPIC_LIFT = {"crew story": 1.7, "course feature": 1.0, "gear": 0.6,
              "behind-the-scenes": 1.3, "humor/trend": 1.1}
PLATFORM_TOPIC_LIFT = {("tiktok", "humor/trend"): 1.9,
                       ("youtube", "behind-the-scenes"): 1.6,
                       ("facebook", "crew story"): 1.4}
PREFIX = {"youtube": "yt", "facebook": "fb", "instagram": "ig", "tiktok": "tt"}


def iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def make_posts():
    posts, tags = [], []
    counter = 1000
    for platform, fmt, typical, count in LINES:
        for i in range(count):
            counter += 1
            topic = rng.choice(list(TOPIC_LIFT))
            age = 4 + i * rng.uniform(4.5, 6.5)  # newest first
            lift = TOPIC_LIFT[topic] * PLATFORM_TOPIC_LIFT.get((platform, topic), 1.0)
            views = int(typical * lift * rng.uniform(0.55, 1.45))
            posts.append(_post(platform, fmt, str(counter), age, views,
                               rng.choice(CAPTIONS[topic])))
            tags.append((posts[-1], topic, fmt, "you"))
    return posts, tags


def _post(platform, fmt, pid, age_days, views, caption):
    likes = int(views * rng.uniform(0.04, 0.09))
    p = {
        "platform": platform,
        "post_id": pid,
        "url": f"https://example.com/sample/{platform}/{pid}",
        "published_at": iso(NOW - timedelta(days=age_days)),
        "format": fmt,
        "caption_snippet": caption,
        "views": views,
        "likes": likes,
        "comments": int(likes * rng.uniform(0.05, 0.15)),
        "shares": int(views * rng.uniform(0.004, 0.02)),
        "saves": int(views * rng.uniform(0.003, 0.015)) if platform in ("instagram", "tiktok") else None,
        "watch_min": int(views * rng.uniform(0.3, 0.9)) if platform == "youtube" else None,
        "avg_view_sec": round(rng.uniform(14, 48), 1) if platform == "youtube" else None,
    }
    if platform == "youtube" and fmt == "long":
        p["avg_view_sec"] = round(rng.uniform(140, 300), 1)
    return p


def seed_special_posts(posts, tags):
    """Three posts the done-check looks for."""
    # 1) An Instagram Reel at exactly 3.0x normal. Reset the other eligible
    #    Instagram Reels so their median is exactly 4,000 views.
    reels = [p for p in posts if p["platform"] == "instagram" and p["format"] == "reel"]
    eligible = sorted((p for p in reels
                       if (NOW - datetime.fromisoformat(p["published_at"].replace("Z", "+00:00"))).days >= 7),
                      key=lambda p: p["published_at"], reverse=True)
    n = len(eligible)
    for i, p in enumerate(eligible):  # symmetric around 4000, so the median is exactly 4000
        p["views"] = int(4000 + (i - (n - 1) / 2) * 300)
    star = _post("instagram", "reel", "17890000000000001", 12, 12000,
                 "The 4:45am crew walk-out, start to finish")
    posts.append(star)
    tags.append((star, "crew story", "reel", "you"))

    # 2) A TikTok posted 3 days ago: too early to judge.
    fresh = _post("tiktok", "video", "7300000000000000001", 3, 2100,
                  "Frost delay. Again.")
    posts.append(fresh)
    tags.append((fresh, "humor/trend", "video", "auto"))

    # 3) A Facebook photo nobody has tagged, whose caption matches no keyword.
    untagged = _post("facebook", "photo", "550000000000000001", 15, 520,
                     "Saturday.")
    posts.append(untagged)  # deliberately no row in post_tags.csv


def main():
    posts, tags = make_posts()
    seed_special_posts(posts, tags)

    followers = {"youtube": 3100, "facebook": 2200, "instagram": 9800, "tiktok": 18400}
    weekly_gain = {"youtube": 60, "facebook": 15, "instagram": 140, "tiktok": 420}
    for w in range(WEEKS):
        when = NOW - timedelta(weeks=WEEKS - 1 - w)
        accounts = []
        for platform, base in followers.items():
            f = base + w * weekly_gain[platform] + rng.randint(-25, 40)
            accounts.append({
                "platform": platform,
                "account_id": f"sample-{platform}",
                "name": "Behind the Greens (sample)",
                "followers": f,
                "total_views": None,
                "views_7d": int({"youtube": 9000, "facebook": 6000, "instagram": 21000,
                                 "tiktok": 48000}[platform] * rng.uniform(0.8, 1.25)),
            })
        last = w == WEEKS - 1
        visible = [p for p in posts
                   if datetime.fromisoformat(p["published_at"].replace("Z", "+00:00")) <= when]
        snap = {
            "schema_version": 1,
            "fetched_at": iso(when),
            "sample": True,
            "accounts": accounts,
            "posts": visible if last else [],  # only the newest snapshot needs posts
            "errors": [],
        }
        (HERE / f"{when:%Y-%m-%d}.json").write_text(json.dumps(snap, indent=1))

    with open(HERE / "post_tags.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["key", "platform", "topic", "format", "tagged_by", "caption_snippet"])
        for post, topic, fmt, by in tags:
            w.writerow([f"{PREFIX[post['platform']]}_{post['post_id']}", post["platform"],
                        topic, fmt, by, post["caption_snippet"]])
    print(f"Wrote {WEEKS} sample snapshots and post_tags.csv to {HERE}")


if __name__ == "__main__":
    main()
