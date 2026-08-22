"""Minimal config for the portable knowledge brain (read-only copy).

This intentionally replaces the full pipeline config from the main repo.
It contains ONLY the paths the read/search modules need. Searching the brain
requires NO API keys — embeddings run locally via fastembed.
"""
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

KNOWLEDGE_STORE_FILE = PROJECT_ROOT / "data" / "learning-store.json"
KNOWLEDGE_VECTORS_FILE = PROJECT_ROOT / "data" / "learning-vectors.npy"
KNOWLEDGE_VECTOR_IDS_FILE = PROJECT_ROOT / "data" / "learning-vector-ids.json"
KNOWLEDGE_DOMAINS_FILE = PROJECT_ROOT / "knowledge" / "domains.json"
