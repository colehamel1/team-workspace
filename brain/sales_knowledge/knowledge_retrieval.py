"""Local semantic retrieval over the knowledge brain.

Persists card embeddings once (fastembed, local, free) to a .npy + parallel id list, then answers
query -> top-k cards with metadata filters. This is the one query->cards path the MCP server and any
future consumer call, replacing whole-store reads and love-of-god's raw-file filter.

COVERAGE CONTRACT (never silently drop unenriched cards):
- Semantic ranking covers 100% of cards -- every card is embedded regardless of whether it has a fold/rarity.
- `domains` is present on every card, so a domain filter drops nothing unenriched.
- A `rarity_min` filter drops ONLY cards whose rarity is present AND below the floor. Cards with NO rarity
  are UNSCORED, not below-floor: they are INCLUDED by default (flagged `unscored`), and the response's
  `coverage` block reports how many returned results are unscored. Pass `exclude_unscored=True` to opt into
  dropping them -- but that is the caller's explicit choice, never a silent default.
"""
import json

import numpy as np

import config
from . import knowledge_store

_EMB = None
_DIM = 384  # BAAI/bge-small-en-v1.5


def _model():
    global _EMB
    if _EMB is None:
        from fastembed import TextEmbedding
        _EMB = TextEmbedding("BAAI/bge-small-en-v1.5")
    return _EMB


def _embed(texts):
    X = np.array(list(_model().embed([(t or "")[:512] for t in texts])), dtype=np.float32)
    return X / (np.linalg.norm(X, axis=1, keepdims=True) + 1e-9)


def card_text(c):
    """What we embed: the idea + why + the stealable nugget + the teachable pattern + technique + topic.
    Recall-oriented, not display. exact_pattern is often the sharpest phrasing of the move, and technique_name
    groups near-duplicates, so both are embedded to improve matching (not just returned)."""
    parts = [c.get("claim", ""), c.get("mechanism") or "", (c.get("fold") or {}).get("nugget") or "",
             c.get("exact_pattern") or "", c.get("technique_name") or "", c.get("topic") or ""]
    return " ".join(p for p in parts if p).strip() or (c.get("claim") or "")


# ---- index persistence ----

def build_index(log, rebuild=False):
    """Embed cards missing from the index and append (or rebuild from scratch). Returns vector count."""
    store = knowledge_store.load()
    cards = store.get("cards", [])
    vec_f, ids_f = config.KNOWLEDGE_VECTORS_FILE, config.KNOWLEDGE_VECTOR_IDS_FILE
    if not rebuild and vec_f.exists() and ids_f.exists():
        ids = json.loads(ids_f.read_text(encoding="utf-8"))
        X = np.load(vec_f)
    else:
        ids, X = [], np.zeros((0, _DIM), dtype=np.float32)
    have = set(ids)
    todo = [c for c in cards if c.get("id") and c["id"] not in have]
    if todo:
        newX = _embed([card_text(c) for c in todo])
        X = np.vstack([X, newX]) if len(X) else newX
        ids = ids + [c["id"] for c in todo]
    np.save(vec_f, X)
    ids_f.write_text(json.dumps(ids), encoding="utf-8")
    log.info(f"index: {len(ids)} vectors persisted ({len(todo)} newly embedded) -> {vec_f.name}")
    return len(ids)


_IDX = None


def _load_index():
    global _IDX
    if _IDX is None:
        vec_f, ids_f = config.KNOWLEDGE_VECTORS_FILE, config.KNOWLEDGE_VECTOR_IDS_FILE
        if not (vec_f.exists() and ids_f.exists()):
            raise FileNotFoundError("No index yet. Run `python run.py knowledge-index` first.")
        _IDX = (json.loads(ids_f.read_text(encoding="utf-8")), np.load(vec_f))
    return _IDX


def _project(c, srcs, score, rarity):
    s = srcs.get(c.get("source_id"), {})
    fold = c.get("fold") or {}
    return {
        "id": c.get("id"), "score": round(score, 4),
        "claim": c.get("claim", ""), "nugget": fold.get("nugget", ""),
        "mechanism": c.get("mechanism", ""),
        "exact_pattern": c.get("exact_pattern", ""),  # the teachable, reusable shape (agents want this, not the raw quote)
        "technique": c.get("technique", ""), "technique_name": c.get("technique_name", ""),
        "domains": c.get("domains") or [], "rarity": rarity, "rarity_baseline": fold.get("rarity_baseline"),
        "unscored": rarity is None,
        "verification": c.get("verification"),
        "source": {"id": c.get("source_id"), "title": s.get("title", ""),
                   "operator": c.get("operator") or s.get("operator", ""),  # card-stamped operator, source as fallback
                   "url": s.get("url", ""), "timestamp": c.get("timestamp")},
    }


def _corpus_card(c):
    """Fuller card projection for bulk corpus consumers (love-of-god's Ad Brain), carrying the fields it
    needs to build principles: the full idea + provenance anchor + domains + rarity."""
    fold = c.get("fold") or {}
    return {"id": c.get("id"), "source_id": c.get("source_id"), "operator": c.get("operator", ""),
            "claim": c.get("claim"), "mechanism": c.get("mechanism"), "body": c.get("body"),
            "example": c.get("example"), "exact_pattern": c.get("exact_pattern", ""),
            "verbatim_anchor": c.get("verbatim_anchor"),
            "technique": c.get("technique", ""), "technique_name": c.get("technique_name", ""),
            "timestamp": c.get("timestamp"), "timestamp_seconds": c.get("timestamp_seconds"),
            "topic": c.get("topic"), "domains": c.get("domains") or [],
            "rarity": fold.get("rarity"), "rarity_baseline": fold.get("rarity_baseline")}


def corpus(domains=None, rarity_min=None, verification=None, exclude_unscored=False):
    """Bulk metadata filter (NO semantic query): every card whose domains intersect `domains`, plus the
    source rows they reference. The single path bulk consumers use to pull a domain corpus, replacing a raw
    read of learning-store.json. Same coverage contract: unscored cards are kept unless exclude_unscored."""
    store = knowledge_store.load()
    srcs = {s["id"]: s for s in store.get("sources", [])}
    want = set(domains) if domains else None
    cards, used = [], set()
    for c in store.get("cards", []):
        if want and not (want & set(c.get("domains") or [])):
            continue
        if verification and c.get("verification") != verification:
            continue
        r = (c.get("fold") or {}).get("rarity")
        if rarity_min is not None:
            if r is None:
                if exclude_unscored:
                    continue
            elif r < rarity_min:
                continue
        cards.append(_corpus_card(c))
        used.add(c.get("source_id"))
    sources = [{"id": s["id"], "title": s.get("title", ""), "url": s.get("url", ""),
                "operator": s.get("operator", ""), "verification": s.get("verification")}
               for sid, s in srcs.items() if sid in used]
    return {"cards": cards, "sources": sources,
            "counts": {"cards": len(cards), "sources": len(sources), "domains": domains}}


def search(query, k=10, domains=None, rarity_min=None, source_id=None, verification=None, exclude_unscored=False):
    """Semantic top-k with filters and the coverage contract (see module docstring)."""
    ids, X = _load_index()
    store = knowledge_store.load()
    by_id = {c["id"]: c for c in store.get("cards", [])}
    srcs = {s["id"]: s for s in store.get("sources", [])}
    q = _embed([query])[0]
    sims = X @ q
    order = np.argsort(-sims)
    want_dom = set(domains) if domains else None
    results = []
    cov = {"returned_with_rarity": 0, "returned_unscored": 0}
    for idx in order:
        cid = ids[idx]
        c = by_id.get(cid)
        if not c:
            continue  # id in index but pruned from store
        if want_dom and not (want_dom & set(c.get("domains") or [])):
            continue
        if source_id and c.get("source_id") != source_id:
            continue
        if verification and c.get("verification") != verification:
            continue
        rarity = (c.get("fold") or {}).get("rarity")
        if rarity_min is not None:
            if rarity is None:
                if exclude_unscored:
                    continue
            elif rarity < rarity_min:
                continue  # present AND below floor -> a real filter, not a coverage gap
        results.append(_project(c, srcs, float(sims[idx]), rarity))
        cov["returned_unscored" if rarity is None else "returned_with_rarity"] += 1
        if len(results) >= k:
            break
    coverage = {"indexed": len(ids), "returned": len(results), **cov,
                "rarity_min": rarity_min, "exclude_unscored": exclude_unscored}
    # Staleness: cards in the store but not yet in the index (e.g. ingested with --no-index, or an index not
    # rebuilt after a --force re-extract). Report it; never auto-rebuild, never fail.
    missing = len({c["id"] for c in store.get("cards", [])} - set(ids))
    if missing:
        coverage["index_stale"] = {"missing": missing,
                                   "fix": "run `python run.py knowledge-index` to embed the missing cards"}
    if rarity_min is not None and cov["returned_unscored"] and not exclude_unscored:
        coverage["note"] = (f"{cov['returned_unscored']} of {len(results)} results are unscored for rarity and "
                            "were INCLUDED, not dropped. Pass exclude_unscored=true to omit them.")
    return {"query": query, "k": k, "filters": {"domains": domains, "rarity_min": rarity_min,
            "source_id": source_id, "verification": verification}, "results": results, "coverage": coverage}
