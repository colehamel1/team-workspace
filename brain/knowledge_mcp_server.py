#!/usr/bin/env python
"""MCP server exposing the company knowledge brain to any repo, over stdio.

The brain is ~6.6k distilled idea-cards mined from operator videos across marketing/GTM domains
(cold outreach, paid ads, ad creative, landing/offer, ecommerce, TikTok Shop, content, email, brand,
AI tooling). This server is the single, uniform way any tool reaches it -- semantic search, single-card
and single-source lookup, the domain map, and a bulk domain-corpus pull. All of it routes through
sales_knowledge.knowledge_retrieval (the one reader), so there is exactly one access path to the brain.

Register in any repo's .mcp.json:
  "knowledge-brain": {
    "command": "/Users/bradyarzdorf/Documents/N8N-builder/sales-knowledge/venv/bin/python",
    "args": ["/Users/bradyarzdorf/Documents/N8N-builder/sales-knowledge/knowledge_mcp_server.py"]
  }

USAGE RULES for calling tools (encoded in the tool docs too):
- Pull the SHARPEST SPECIFIC card, not an averaged consensus. The value is the concrete tactic.
- Convergence (many operators saying it) is a TRUST signal, not a quality ranking. Rarity is the quality/edge axis.
- Always CITE the operator + source when you use a card.
- The brain supplies CRAFT (how the tactic works). The calling tool supplies its OWN brand/ICP context.
"""
import logging
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
os.chdir(HERE)  # so config's relative paths (store, index, taxonomy) resolve

logging.basicConfig(level=logging.WARNING)  # keep stdout clean for the JSON-RPC transport

from fastmcp import FastMCP  # noqa: E402
from sales_knowledge import knowledge_retrieval as kr, knowledge_store, knowledge_taxonomy as tax  # noqa: E402

mcp = FastMCP("knowledge-brain")


@mcp.tool
def search_knowledge(query: str, k: int = 10, domains: list[str] | None = None,
                     rarity_min: int | None = None, exclude_unscored: bool = False) -> dict:
    """Semantic search over the knowledge brain. Returns the top-k idea-cards most relevant to `query`,
    each with its claim, mechanism, rarity, domains, and operator/source citation, plus a coverage block.

    Filters: `domains` (restrict to domain keys from list_domains), `rarity_min` (edge floor). COVERAGE
    CONTRACT: cards with no rarity are UNSCORED, not below-floor -- they are included even when rarity_min
    is set (flagged unscored) and counted in `coverage`. Pass exclude_unscored=true to omit them explicitly.

    Use the sharpest specific card; cite the operator; convergence is trust not quality; you supply brand context."""
    return kr.search(query, k=k, domains=domains, rarity_min=rarity_min, exclude_unscored=exclude_unscored)


@mcp.tool
def get_card(card_id: str) -> dict:
    """Fetch one full card by id: claim, mechanism, body, example, domains, fold (rarity/nugget), source_id, timestamp."""
    store = knowledge_store.load()
    for c in store.get("cards", []):
        if c.get("id") == card_id:
            return c
    return {"error": "not_found", "id": card_id}


@mcp.tool
def get_source(source_id: str) -> dict:
    """Fetch a source (video) row by id -- title, url, operator, verification -- plus its live card count."""
    store = knowledge_store.load()
    s = next((x for x in store.get("sources", []) if x.get("id") == source_id), None)
    if not s:
        return {"error": "not_found", "id": source_id}
    n = sum(1 for c in store.get("cards", []) if c.get("source_id") == source_id)
    return {**s, "n_cards": n}


@mcp.tool
def list_domains() -> dict:
    """List the brain's domains (key, description, expert baseline) with live card counts, plus store totals.
    Use this to discover valid `domains` filter values and to see what the brain currently covers."""
    from collections import Counter
    store = knowledge_store.load()
    dist = Counter(d for c in store.get("cards", []) for d in (c.get("domains") or []))
    rows = [{"key": k, "desc": d, "expert_baseline": tax.baseline(k), "cards": dist.get(k, 0)}
            for k, d in tax.domains()]
    return {"domains": rows, "total_cards": len(store.get("cards", [])),
            "total_sources": len(store.get("sources", []))}


@mcp.tool
def get_corpus(domains: list[str], rarity_min: int | None = None) -> dict:
    """Bulk pull: ALL cards whose domains include any of `domains` (no semantic query), plus their source
    rows. For building a whole-domain corpus (e.g. an ad-principles library). Returns {cards, sources, counts}."""
    return kr.corpus(domains=domains, rarity_min=rarity_min)


if __name__ == "__main__":
    mcp.run()
