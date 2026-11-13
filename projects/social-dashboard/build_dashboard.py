"""Builds dashboard.html from the saved stat snapshots.

    py build_dashboard.py            # your real numbers (from data/)
    py build_dashboard.py --sample   # fake sample numbers, for previewing

Needs nothing installed beyond Python itself.
"""
import argparse
import html
import sys
from datetime import datetime
from pathlib import Path

import metrics as m

HERE = Path(__file__).resolve().parent
esc = html.escape


def fmt_num(n):
    if n is None:
        return "—"
    if abs(n) >= 10000:
        return f"{n / 1000:.1f}k".replace(".0k", "k")
    return f"{n:,.0f}"


def fmt_pct(x, digits=1):
    return "—" if x is None else f"{x * 100:.{digits}f}%"


def fmt_date(iso):
    return datetime.fromisoformat(iso[:10]).strftime("%b %-d") if sys.platform != "win32" \
        else datetime.fromisoformat(iso[:10]).strftime("%b %#d")


def sparkline(history):
    if len(history) < 2:
        return '<div class="spark-empty">Trend appears after 2 refreshes</div>'
    w, h, pad = 220, 48, 6
    vals = [v for _, v in history]
    lo, hi = min(vals), max(vals)
    span = (hi - lo) or 1
    pts = []
    for i, (d, v) in enumerate(history):
        x = pad + i * (w - 2 * pad) / (len(history) - 1)
        y = h - pad - (v - lo) * (h - 2 * pad) / span
        pts.append((x, y, d, v))
    line = " ".join(f"{x:.1f},{y:.1f}" for x, y, _, _ in pts)
    dots = "".join(
        f'<circle class="hit" cx="{x:.1f}" cy="{y:.1f}" r="9" data-tip="{esc(fmt_date(d))}: {v:,} followers"/>'
        f'<circle class="dot" cx="{x:.1f}" cy="{y:.1f}" r="{4 if i == len(pts) - 1 else 0}"/>'
        for i, (x, y, d, v) in enumerate(pts))
    return (f'<svg class="spark" viewBox="0 0 {w} {h}" role="img" '
            f'aria-label="Followers over the last {len(history)} refreshes">'
            f'<polyline points="{line}"/>{dots}</svg>')


def card_html(c):
    name = m.PLATFORM_NAMES[c["platform"]]
    if not c["connected"]:
        return (f'<article class="card off"><h3>{name}</h3>'
                f'<p class="muted">Not connected yet</p></article>')
    if c["delta"] is None:
        delta = '<span class="muted">first refresh</span>'
    elif c["delta"] == 0:
        delta = f'<span class="muted">no change since {fmt_date(c["prev_date"])}</span>'
    else:
        sign = "+" if c["delta"] >= 0 else "−"
        delta = (f'<span class="delta {"up" if c["delta"] >= 0 else "down"}">'
                 f'{"▲" if c["delta"] >= 0 else "▼"} {sign}{abs(c["delta"]):,}</span> '
                 f'<span class="muted">since {fmt_date(c["prev_date"])}</span>')
    stale = (f'<p class="stale">⚠ Couldn\'t refresh. Showing numbers from {fmt_date(c["stale_since"])}. '
             f'{esc(c["error"] or "")}</p>') if c["error"] else ""
    return f'''<article class="card">
  <h3>{name}</h3>
  <div class="big">{fmt_num(c["followers"])}<span class="unit">followers</span></div>
  <div class="deltarow">{delta}</div>
  {sparkline(c["history"])}
  <dl class="mini">
    <div><dt>Views, last 7 days</dt><dd>{fmt_num(c["views_7d"])}</dd></div>
    <div><dt>Posts, last 30 days</dt><dd>{c["posts_30d"]}</dd></div>
  </dl>
  {stale}
</article>'''


def post_rows(posts, scale):
    rows = []
    for p in posts:
        width = min(p["multiple"] / scale, 1) * 100
        normal = 1 / scale * 100
        topic = esc(p["topic"]) if p["topic"] else '<span class="untag">untagged</span>'
        rows.append(f'''<tr>
  <td class="pl">{m.PLATFORM_NAMES[p["platform"]]}<span class="fmt">{esc(p.get("format") or "")}</span></td>
  <td class="cap"><a href="{esc(p.get("url") or "#")}" target="_blank" rel="noopener">{esc(p.get("caption_snippet") or "(no caption)")}</a>
      <span class="topic">{topic}</span></td>
  <td class="num">{fmt_num(p["views"])}</td>
  <td class="mult" data-tip="{fmt_num(p["views"])} views vs a typical {fmt_num(p["baseline"])} for {m.PLATFORM_NAMES[p["platform"]]} {esc(p.get("format") or "")}s">
    <div class="bar"><span style="width:{width:.1f}%"></span><i style="left:{normal:.1f}%"></i></div>
    <b>{p["multiple"]:.1f}× normal</b></td>
  <td class="num">{fmt_pct(p["rate"])}</td>
</tr>''')
    return "\n".join(rows) or '<tr><td colspan="5" class="muted">Not enough posts yet.</td></tr>'


def post_table(title, note, posts, scale):
    return f'''<div class="ptable">
  <h3>{title}</h3><p class="muted small">{note}</p>
  <table>
    <thead><tr><th>Where</th><th>Post</th><th class="num">Views</th><th>vs. your normal</th>
      <th class="num" title="Shares + saves, per view">Shares+saves</th></tr></thead>
    <tbody>{post_rows(posts, scale)}</tbody>
  </table></div>'''


def board_cell(val, n):
    if val is None:
        return '<td class="cell empty" data-tip="No judged posts yet">—</td>'
    # Brand green above normal, brand clay below, neutral at 1.0x. Capped so text stays readable.
    strength = min(abs(val - 1) / 1.0, 1) * 55
    side = "pos" if val >= 1 else "neg"
    thin = " thin" if n < 3 else ""
    tip = f"Median {val:.1f}× normal across {n} post{'s' if n != 1 else ''}"
    if n < 3:
        tip += " (too few to trust yet)"
    return (f'<td class="cell{thin}" style="--mix:{strength:.0f}%;--pole:var(--{side})" '
            f'data-tip="{esc(tip)}"><b>{val:.1f}×</b><span>{n} post{"s" if n != 1 else ""}</span></td>')


def board_html(r):
    head = "".join(f"<th>{m.PLATFORM_NAMES[p]}</th>" for p in m.PLATFORMS)
    rows = []
    topics = sorted(m.TOPICS, key=lambda t: -(r["topic_overall"][t][0] or 0))
    for t in topics:
        overall, n = r["topic_overall"][t]
        cells = "".join(board_cell(*r["board"][(t, p)]) for p in m.PLATFORMS)
        rows.append(f'<tr><th scope="row">{esc(t)}</th>{cells}{board_cell(overall, n)}</tr>')
    return f'''<table class="board">
  <thead><tr><th></th>{head}<th>All</th></tr></thead>
  <tbody>{"".join(rows)}</tbody></table>
  <p class="legend"><span class="sw neg"></span> below your normal
    <span class="sw mid"></span> about normal <span class="sw pos"></span> above your normal
    · faded = fewer than 3 posts, so don't trust it yet</p>'''


def kit_html(r):
    rows = "".join(
        f'<tr><th scope="row">{m.PLATFORM_NAMES[k["platform"]]}</th><td>{"—" if k["followers"] is None else f'{k["followers"]:,}'}</td>'
        f'<td>{"—" if k["median_views"] is None else f'{k["median_views"]:,.0f}'}</td><td>{fmt_pct(k["share_save_rate"])}</td></tr>'
        for k in r["kit"])
    total = sum(k["followers"] or 0 for k in r["kit"])
    return f'''<table class="kit"><thead><tr><th></th><th>Followers</th>
  <th>Typical views per post</th><th>Shares+saves rate</th></tr></thead>
  <tbody>{rows}</tbody></table>
  <p class="kittotal">Combined audience: <b>{total:,}</b> followers across {sum(1 for k in r["kit"] if k["followers"])} platforms
   <span class="muted">· typical = median of posts from the last 90 days</span></p>'''


def render(r):
    sample_banner = ('<div class="banner">SAMPLE DATA: these numbers are made up, '
                     'for previewing the layout. Nothing is connected yet.</div>') if r["sample"] else ""
    cards = "\n".join(card_html(c) for c in r["cards"])
    judged = r["top"] + r["bottom"]
    scale = max([2.0] + [p["multiple"] for p in judged])
    early = "".join(
        f'<li><b>{m.PLATFORM_NAMES[p["platform"]]}</b> · {esc(p.get("caption_snippet") or "")} '
        f'<span class="muted">· {fmt_num(p["views"])} views so far · too early, '
        f'{max(0, round(m.min_age(p) - p["age_days"]))} more days</span></li>'
        for p in r["too_early"]) or '<li class="muted">Nothing new this week.</li>'
    untagged = len(r["untagged"])
    tag_note = (f'<p class="note"><b>{untagged} post{"s" if untagged != 1 else ""} untagged.</b> '
                f'Open <code>post_tags.csv</code> and give {"them" if untagged != 1 else "it"} a topic, '
                f'or ask Claude to "tag my new posts."</p>') if untagged else ""
    auto_note = (f'<p class="note">{r["auto_tagged"]} topic tag{"s" if r["auto_tagged"] != 1 else ""} '
                 f'were guessed from captions. Check them in <code>post_tags.csv</code>.</p>'
                 ) if r["auto_tagged"] else ""
    updated = datetime.fromisoformat(r["fetched_at"].replace("Z", "+00:00"))
    return TEMPLATE.format(
        banner=sample_banner, cards=cards, updated=esc(updated.strftime("%a %b %d, %Y")),
        snaps=r["snapshot_count"], posts=r["post_count"],
        top=post_table("Best performers", "Your 5 posts that beat their usual numbers by the most.",
                       r["top"], scale),
        bottom=post_table("Underperformers", "The 5 that fell furthest below normal. Look for the pattern.",
                          r["bottom"], scale),
        board=board_html(r), early=early, tag_note=tag_note, auto_note=auto_note,
        kit=kit_html(r), min_age=m.MIN_AGE_DAYS, yt_age=m.MIN_AGE_DAYS_YT_LONG,
        n_base=m.BASELINE_POSTS, min_base=m.MIN_BASELINE)


TEMPLATE = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BTG Social Stats</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=Public+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
:root {{
  color-scheme: light;
  --bg:#F3EEDF; --card:#FBF8EF; --ink:#14140F; --ink-2:#4A4A40; --muted:#6E6A5C;
  --line:#DDD4BC; --accent:#163A2B; --accent-2:#4C7A4A; --gold:#C1922F;
  --pos:#4C7A4A; --neg:#A5402C; --mid:#FBF8EF; --up:#2F6B35; --down:#A5402C;
  --banner:#C1922F; --banner-ink:#14140F;
}}
@media (prefers-color-scheme: dark) {{
  :root:not([data-theme="light"]) {{
    color-scheme: dark;
    --bg:#0F2A1F; --card:#163A2B; --ink:#F3EEDF; --ink-2:#D9D2BD; --muted:#A9A58F;
    --line:#2C4A3B; --accent:#C9B896; --accent-2:#8DBB86; --gold:#D6A946;
    --pos:#5E9A5A; --neg:#C2553D; --mid:#163A2B; --up:#8DBB86; --down:#E08A73;
  }}
}}
:root[data-theme="dark"] {{
  color-scheme: dark;
  --bg:#0F2A1F; --card:#163A2B; --ink:#F3EEDF; --ink-2:#D9D2BD; --muted:#A9A58F;
  --line:#2C4A3B; --accent:#C9B896; --accent-2:#8DBB86; --gold:#D6A946;
  --pos:#5E9A5A; --neg:#C2553D; --mid:#163A2B; --up:#8DBB86; --down:#E08A73;
}}
* {{ box-sizing:border-box; }}
body {{ margin:0; background:var(--bg); color:var(--ink);
  font:15px/1.5 "Public Sans", system-ui, sans-serif; }}
.wrap {{ max-width:1180px; margin:0 auto; padding:24px 16px 64px; }}
h1, h2 {{ font-family:"Big Shoulders Display", "Arial Narrow", sans-serif; text-transform:uppercase;
  letter-spacing:.02em; margin:0; }}
h1 {{ font-size:40px; line-height:1; }}
h2 {{ font-size:26px; margin:40px 0 4px; }}
h3 {{ margin:0 0 4px; font-size:15px; }}
.muted {{ color:var(--muted); }} .small {{ font-size:13px; margin:0 0 10px; }}
header {{ display:flex; flex-wrap:wrap; gap:8px 24px; align-items:end; justify-content:space-between;
  border-bottom:2px solid var(--ink); padding-bottom:14px; }}
header p {{ margin:0; color:var(--ink-2); }}
.banner {{ background:var(--banner); color:var(--banner-ink); font-weight:700; padding:10px 14px;
  border-radius:6px; margin-bottom:18px; }}
.sub {{ color:var(--ink-2); margin:0 0 14px; }}
.cards {{ display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:14px; margin-top:20px; }}
.card {{ background:var(--card); border:1px solid var(--line); border-radius:10px; padding:16px; }}
.card.off {{ opacity:.6; }}
.card h3 {{ text-transform:uppercase; letter-spacing:.06em; font-size:12px; color:var(--ink-2); }}
.big {{ font-family:"Big Shoulders Display", sans-serif; font-weight:800; font-size:44px; line-height:1.05; }}
.unit {{ font-family:"Public Sans", sans-serif; font-size:13px; font-weight:400; color:var(--muted); margin-left:6px; }}
.deltarow {{ font-size:13px; margin:2px 0 8px; }}
.delta.up {{ color:var(--up); font-weight:700; }} .delta.down {{ color:var(--down); font-weight:700; }}
.spark {{ width:100%; height:48px; display:block; overflow:visible; }}
.spark polyline {{ fill:none; stroke:var(--accent-2); stroke-width:2; stroke-linejoin:round; stroke-linecap:round; }}
.spark .dot {{ fill:var(--accent-2); stroke:var(--card); stroke-width:2; }}
.spark .hit {{ fill:transparent; cursor:default; }}
.spark-empty {{ font-size:12px; color:var(--muted); height:48px; display:flex; align-items:center; }}
.mini {{ display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:10px 0 0; }}
.mini dt {{ font-size:12px; color:var(--muted); }} .mini dd {{ margin:0; font-weight:700; }}
.stale {{ font-size:12px; color:var(--down); margin:10px 0 0; }}
.split {{ display:grid; grid-template-columns:1fr; gap:22px; }}
@media (min-width:1000px) {{ .split {{ grid-template-columns:1fr 1fr; }} }}
.ptable, .boardwrap, .kitwrap, .early {{ background:var(--card); border:1px solid var(--line);
  border-radius:10px; padding:16px; overflow-x:auto; }}
table {{ border-collapse:collapse; width:100%; }}
th {{ text-align:left; font-size:12px; font-weight:600; color:var(--muted); padding:6px 8px;
  border-bottom:1px solid var(--line); white-space:nowrap; }}
td {{ padding:8px; border-bottom:1px solid var(--line); vertical-align:top; }}
tr:last-child td {{ border-bottom:0; }}
.num {{ text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }}
.pl {{ font-weight:600; white-space:nowrap; font-size:13px; }}
.fmt {{ display:block; font-weight:400; color:var(--muted); font-size:12px; }}
.cap a {{ color:var(--ink); text-decoration:none; }} .cap a:hover {{ text-decoration:underline; }}
.topic {{ display:block; font-size:12px; color:var(--ink-2); }}
.untag {{ color:var(--down); }}
.mult {{ min-width:150px; font-size:13px; }}
.bar {{ position:relative; height:8px; background:var(--line); border-radius:4px; margin:6px 0 4px; }}
.bar span {{ position:absolute; left:0; top:0; bottom:0; background:var(--accent-2); border-radius:4px; }}
.bar i {{ position:absolute; top:-3px; bottom:-3px; width:2px; background:var(--ink); }}
.board td.cell {{ text-align:center; min-width:86px;
  background:color-mix(in oklab, var(--pole) var(--mix), var(--mid)); border:2px solid var(--card); }}
.board td.cell b {{ display:block; font-size:16px; }}
.board td.cell span {{ font-size:11px; color:var(--ink-2); }}
.board td.thin {{ opacity:.55; }}
.board td.empty {{ color:var(--muted); background:transparent; }}
.board th[scope=row] {{ color:var(--ink); font-size:14px; }}
.legend {{ font-size:12px; color:var(--muted); margin:10px 0 0; }}
.sw {{ display:inline-block; width:12px; height:12px; border-radius:3px; vertical-align:-2px; margin:0 3px 0 10px; }}
.sw.pos {{ background:color-mix(in oklab, var(--pos) 55%, var(--mid)); }}
.sw.neg {{ background:color-mix(in oklab, var(--neg) 55%, var(--mid)); }}
.sw.mid {{ background:var(--mid); border:1px solid var(--line); }}
.early ul {{ margin:0; padding-left:18px; }} .early li {{ margin:4px 0; }}
.note {{ background:var(--card); border-left:4px solid var(--gold); padding:10px 14px; margin:12px 0 0; border-radius:4px; }}
.kit td {{ font-weight:700; font-variant-numeric:tabular-nums; }}
.kittotal {{ margin:12px 0 0; }}
.debrief {{ background:var(--accent); color:var(--bg); border-radius:10px; padding:18px; margin-top:40px; }}
.debrief h2 {{ margin:0 0 6px; }} .debrief code {{ background:rgba(255,255,255,.15); color:inherit; }}
code {{ background:var(--line); padding:1px 5px; border-radius:4px; font-size:13px; }}
footer {{ margin-top:32px; font-size:12px; color:var(--muted); }}
#tip {{ position:fixed; pointer-events:none; z-index:9; background:var(--ink); color:var(--bg);
  font-size:12px; padding:6px 9px; border-radius:6px; max-width:260px; display:none; }}
@media (max-width:600px) {{ h1 {{ font-size:32px; }} .big {{ font-size:38px; }} }}
</style></head>
<body><div class="wrap">
{banner}
<header>
  <div><h1>Behind the Greens<br>Social Stats</h1></div>
  <p>Last updated <b>{updated}</b> · {snaps} refreshes on file · {posts} posts tracked</p>
</header>

<section class="cards">
{cards}
</section>

<h2>What's working</h2>
<p class="sub">Each post is compared with <b>your own typical post</b> on the same platform and format.
"2.0× normal" means it got twice the views your posts like it usually get.</p>
<div class="split">
{top}
{bottom}
</div>

<h2>Topic scoreboard</h2>
<p class="sub">Which kinds of posts win, platform by platform. This tells you what to make more of.</p>
<div class="boardwrap">{board}</div>
{tag_note}{auto_note}

<h2>Just posted</h2>
<p class="sub">Too new to judge. Posts get a fair grade after {min_age} days ({yt_age} for long YouTube videos).</p>
<div class="early"><ul>{early}</ul></div>

<h2>Media kit numbers</h2>
<p class="sub">Real numbers you can copy into the Media Kit page for partners.</p>
<div class="kitwrap">{kit}</div>

<div class="debrief">
  <h2>Get your debrief</h2>
  After each refresh, open Claude in this workspace and say <code>debrief me</code>.
  You'll get a short read on what grew and what flopped, ending with what to make more of and what to stop.
</div>

<footer>How "normal" works: the median views of your last {n_base} posts on the same platform and format
that are old enough to judge (at least {min_base} needed). Shares+saves rate = (shares + saves) ÷ views.
Facebook and YouTube don't report saves.</footer>
</div>
<div id="tip" role="tooltip"></div>
<script>
(function () {{
  var tip = document.getElementById('tip');
  document.addEventListener('mousemove', function (e) {{
    var t = e.target.closest && e.target.closest('[data-tip]');
    if (!t) {{ tip.style.display = 'none'; return; }}
    tip.textContent = t.getAttribute('data-tip');
    tip.style.display = 'block';
    var x = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 8);
    tip.style.left = x + 'px'; tip.style.top = (e.clientY + 14) + 'px';
  }});
}})();
</script>
</body></html>
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--sample", action="store_true", help="use the fake sample numbers")
    args = ap.parse_args()

    data_dir = HERE / ("sample_data" if args.sample else "data")
    tags_path = data_dir / "post_tags.csv" if args.sample else HERE / "post_tags.csv"
    snaps = m.load_snapshots(data_dir)
    if not snaps:
        sys.exit(f"No stat snapshots in {data_dir}. Run refresh first "
                 f"(or try: py build_dashboard.py --sample)")

    tags = m.load_tags(tags_path)
    added = m.merge_tags(snaps[-1].get("posts", []), tags)
    if added and not args.sample:  # never rewrite the committed sample file
        m.save_tags(tags_path, tags)
        print(f"Added {added} new post(s) to post_tags.csv with guessed topics. Check them when you can.")

    out = HERE / "dashboard.html"
    out.write_text(render(m.compute(snaps, tags)), encoding="utf-8")
    print(f"Dashboard ready: {out}")


if __name__ == "__main__":
    main()
