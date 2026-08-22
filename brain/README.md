# Portable Knowledge Brain (read-only)

A local copy of the team knowledge brain: thousands of idea-cards distilled from
operator videos (marketing, cold outreach, ads, content, ecommerce). Claude searches
it through MCP tools: `search_knowledge`, `get_card`, `get_source`, `list_domains`,
`get_corpus`.

## Status of `data/`

The brain ships **without data**. `data/` must contain three files that Brady
provides separately (a sanitized snapshot — cards and sources only):

- `learning-store.json`
- `learning-vectors.npy`
- `learning-vector-ids.json`

If `data/` is empty, the brain is not usable yet — ask Brady for the brain data
files, or for access to the hosted brain if that exists by the time you read this.

## Setup (Claude does this during bootstrap — see ../SETUP_GUIDE.md)

```bash
cd brain
python3 -m venv venv
venv/bin/pip install -r requirements.txt
```

Then register in the workspace's `.mcp.json` (absolute paths required):

```json
{
  "mcpServers": {
    "knowledge-brain": {
      "command": "/ABSOLUTE/PATH/TO/workspace/brain/venv/bin/python",
      "args": ["/ABSOLUTE/PATH/TO/workspace/brain/knowledge_mcp_server.py"]
    }
  }
}
```

Restart Claude Code after writing `.mcp.json` — MCP servers register at startup.

## Notes

- The FIRST search downloads a small local embedding model (~100MB, one time).
  On slow wifi that first search can take a few minutes. This is normal.
- No API keys are needed. Search runs entirely on this machine.
- This copy is a snapshot — it does not update itself. When the brain grows,
  Brady sends a `brain-data.zip` (see "Updating" below).

## Updating the brain (when Brady sends brain-data.zip)

When the user says "update the brain" (or Brady sent them a file called
`brain-data.zip`), Claude does this:

1. Find `brain-data.zip` in Downloads. Unzip it and confirm it contains
   `data/learning-store.json`, `data/learning-vectors.npy`,
   `data/learning-vector-ids.json`, and that the store JSON has a
   `sanitized_for` key (if it doesn't, stop — wrong file, ask Brady).
2. Replace the contents of `brain/data/` with the new files.
3. Tell the user: "Brain updated — quit and reopen Claude Code so I reload it,
   then ask me anything." (The running brain caches the old index until restart.)
- Usage rules (also encoded in the tool docs): pull the sharpest SPECIFIC card,
  not an averaged consensus; always cite the operator + source; the brain supplies
  craft — you supply your own brand/audience context.
