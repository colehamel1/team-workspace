# SETUP_GUIDE.md — instructions for Claude during first-time setup

You (Claude) are setting up this workspace for a member of Brady's team who is
NOT technical. Follow these steps in order. Talk them through it in plain
English, one step at a time. Do every technical action yourself. If a step
fails, try to fix it yourself before involving them; if you truly can't,
tell them exactly what to tell Brady ("setup stopped at step N because X").

## Step 0 — Preflight

- Confirm the OS. **macOS and Windows are both supported** — the commands below
  are written for Mac; on Windows use the equivalents (PowerShell, `py`/`python`
  instead of `python3`, `venv\Scripts\python.exe` instead of `venv/bin/python`,
  backslash paths in `.mcp.json`). Adapt calmly — you know both platforms.
  If this is a Chromebook, a tablet, or something that can't run normal desktop
  apps: stop and say "tell Brady your computer type — this one may not be able
  to run Claude Code."
- Check git and python are installed (`git --version`, `python3 --version` /
  `python --version`). On a fresh Mac either command can pop up a dialog offering
  to install "command line developer tools" — tell the user to click Install and
  wait (can take several minutes). On Windows, if python or git is missing,
  install it for them from the official installers (python.org / git-scm.com),
  telling them what you're doing in one sentence.

## Step 1 — Workspace location

If this kit isn't already at `~/Documents/team-workspace` (Mac) or
`Documents\team-workspace` (Windows), move/copy it there so every path below is
predictable. Work from that folder for the rest of setup.

## Step 2 — Git identity (local only)

- `git config --global user.name "<their full name>"` (ask them)
- `git config --global user.email "<their email>"` (ask them)
- `git init` in the workspace, and make a first commit of the kit files.
- Explain in one sentence: "Git is a save-history for your files — like version
  history in Google Docs."

## Step 3 — GitHub (optional today, offer it)

Ask: "Do you want me to help you create a GitHub account now? It's like Google
Drive for code — you'll need it later to share projects or get access to team
projects. Takes about 5 minutes." If yes: walk them to https://github.com/signup
step by step (they type; you guide; you never see their password). Have them tell
you their username when done, and remind them to send that username to Brady so
he can grant access to anything they're allowed into. If no: skip; nothing else
here depends on it.

## Step 4 — The knowledge brain

- Check `brain/data/` for `learning-store.json`, `learning-vectors.npy`, and
  `learning-vector-ids.json`. If missing, tell the user: "The brain data isn't
  included yet — ask Brady for the brain files or hosted access," and skip to
  Step 6.
- If present: create the venv and install deps per `brain/README.md`
  (`python3 -m venv venv` + `pip install -r requirements.txt` inside `brain/`).
- Write `.mcp.json` at the workspace root exactly per the stanza in
  `brain/README.md`, with real absolute paths for THIS machine.

## Step 5 — Restart + smoke test

Tell the user, in these words or close: "Almost done. Quit Claude Code completely
and reopen it in this same folder — I need a restart to plug into the brain.
When you're back, say: **test the brain**."

When they return and say that: call the `list_domains` tool, then run one
`search_knowledge` query (e.g. "cold email subject lines"). Warn them BEFORE the
first search: "First search downloads a small model — might take a few minutes,
one time only." Show them one result including the operator citation so they see
what the brain gives them.

## Step 6 — Orientation

- Open `TUTORIAL.md` and give them the 2-minute version out loud: how to ask for
  things, what the board is (advisor → engineer → red team), and the traffic-light
  rules — especially: nothing gets sent to a real person and nothing of Brady's
  gets touched without a human okay.
- Suggest a first real task in their actual job ("want to try one? ask me to
  draft a plan for something you're working on this week — I'll run it through
  the board").

## Done-condition

Setup is complete when: git identity set, workspace committed, brain smoke test
passed (or explicitly deferred for missing data), and the user has heard the
2-minute orientation. Tell them: "You're set up. Message Brady that setup
finished." 
