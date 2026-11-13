# Behind the Greens: social stats dashboard

One page that shows YouTube, Facebook, Instagram and TikTok stats together, and
shows **which kinds of posts work** so you know what to make more of.

## See it right now (made-up sample numbers)

From this folder, run:

    py build_dashboard.py --sample

Then open `dashboard.html` in your browser and bookmark it. That's your tab.

## How it works
- `refresh.bat` pulls your stats from each platform and saves a dated
  snapshot in `data/`. Your real numbers stay on your computer and never go into git.
- `build_dashboard.py` turns the snapshots into `dashboard.html`.
- `post_tags.csv` holds a topic and format for each post. New posts get a guessed
  topic (`tagged_by` = auto). Fix any wrong ones and set `tagged_by` to `you`.
  Your rows are never overwritten.
- "× normal" = a post's views ÷ the median of your last 20 posts on the same
  platform and format that are at least 7 days old (28 days for long YouTube videos).

## Status
- [x] Step 1: dashboard with sample numbers
- [x] Step 2 code: connect YouTube (follow CONNECT_YOUTUBE.md on your computer)
- [ ] Step 3: connect Facebook + Instagram
- [ ] Step 4: connect TikTok
- [ ] Step 5: one-click refresh (and an optional weekly auto-run)

Logins are read-only. Keys live only in `.env`. Never paste a password or key into chat.
