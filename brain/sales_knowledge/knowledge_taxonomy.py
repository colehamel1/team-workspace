"""Editable domain taxonomy for the knowledge brain.

One JSON file (knowledge/domains.json) is the single source of truth for BOTH card routing
(knowledge_domain.py) and the per-domain rarity baseline (knowledge_fold.py). Add a domain by editing that
file -- no code change, takes effect on the next run. A baked DEFAULT mirrors the file so nothing breaks if it
is missing or malformed. Same file-with-fallback shape as knowledge_grounding.py.
"""
import json

import config

# Fallback if knowledge/domains.json is missing/unreadable. Keep in sync with the shipped file.
DEFAULT = [
    ("cold_outreach", "Cold email / cold DM / outbound to strangers.", "a seasoned B2B cold-outreach operator who runs high-volume cold email and DM at scale"),
    ("paid_ads", "Running PAID ads (Meta, TikTok, LinkedIn, Google).", "a seasoned 7-figure DTC performance marketer who buys and scales paid media daily"),
    ("ad_creative", "The ad CREATIVE itself: hooks, UGC formats, scripts, angles.", "a seasoned direct-response creative strategist who has shipped thousands of performance ads"),
    ("landing_offer", "Landing pages, sales pages, offers, funnels, CRO, pricing.", "a seasoned CRO and offer strategist who has built and tested many sales funnels"),
    ("ecommerce", "Ecommerce / Shopify store operations, merchandising, DTC ops.", "an experienced DTC ecommerce operator who runs a Shopify store day to day"),
    ("email_lifecycle", "OWNED email/SMS lifecycle marketing (not cold).", "an experienced lifecycle and retention marketer who owns email and SMS flows"),
    ("content_organic", "Organic / short-form content and audience building.", "an experienced content creator and organic-growth operator with a large audience"),
    ("tiktok_shop", "TikTok Shop selling and social commerce, affiliate/creator seeding, live shopping.", "an experienced TikTok Shop and social-commerce operator running affiliate seeding and live selling"),
    ("brand_strategy", "Positioning, brand, offer/business strategy, mindset. Cross-cutting.", "a seasoned brand and business strategist and operator"),
    ("ai_tooling", "AI / automation tools, agents, workflows to run or scale the business.", "a technical operator fluent in AI tools, agents, and automation for business"),
    ("general", "Genuinely broad business insight with no single clear domain.", "a seasoned business operator"),
]

_cache = None


def _load():
    """Return [(key, desc, expert_baseline)] from the file, falling back to DEFAULT."""
    global _cache
    if _cache is not None:
        return _cache
    data = None
    f = getattr(config, "KNOWLEDGE_DOMAINS_FILE", None)
    if f and f.exists():
        try:
            raw = json.loads(f.read_text(encoding="utf-8"))
            items = raw.get("domains") if isinstance(raw, dict) else raw
            rows = [(d["key"], d.get("desc", ""), d.get("expert_baseline", ""))
                    for d in (items or []) if isinstance(d, dict) and d.get("key")]
            if rows:
                data = rows
        except Exception:  # noqa: BLE001 -- malformed file must never break ingest; fall back
            data = None
    _cache = data or DEFAULT
    return _cache


def domains():
    """[(key, desc)] for the classifier prompt/schema."""
    return [(k, d) for k, d, _ in _load()]


def keys():
    return [k for k, _, _ in _load()]


def baseline(key):
    """The rarity-scoring persona for a domain key, with a graceful fall to the 'general' baseline."""
    rows = _load()
    for k, _, b in rows:
        if k == key and b:
            return b
    for k, _, b in rows:
        if k == "general" and b:
            return b
    return "a seasoned business operator"
