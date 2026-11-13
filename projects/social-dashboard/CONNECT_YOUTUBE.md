# Connect YouTube (about 30 minutes, one time)

Do this on **your own computer**. You'll click through Google's website, and Claude
Code (on your computer) can walk you through each part. Just say "help me with part 2."

**Never paste your password or keys into chat.** Keys go only in the `.env` file.

---

## Part 1: Get the latest code
In Claude Code on your computer, inside your `team-workspace` folder, say:

> Pull the branch claude/quirky-bell-ve9yvz from GitHub

## Part 2: Make a free Google Cloud project
1. Go to **console.cloud.google.com** and sign in with the Google account that owns
   the Behind the Greens YouTube channel.
2. Accept the terms if asked. **Don't add a credit card.** None is needed.
3. At the top, click the project picker, then **New project**. Name it `BTG Stats`, then **Create**.
   Make sure `BTG Stats` is selected at the top afterwards.

## Part 3: Turn on the two YouTube switches
1. In the search bar at the top, type **YouTube Data API v3**, open it, and click **Enable**.
2. Search **YouTube Analytics API**, open it, and click **Enable**.

## Part 4: Create your private login app
1. Search **Google Auth Platform** (or "OAuth consent screen") and click **Get started**.
   - App name: `BTG Stats`. Support email: your email. Click **Next**.
   - Audience: **External**. Click **Next**.
   - Contact email: your email. Click **Next**, agree, then **Create**.
2. Go to **Audience** and click **Publish app**, then **Confirm**.
   *(Why: test mode logs you out every 7 days. Published-but-unverified is fine for
   an app only you use. You'll just see a one-time warning.)*
3. Go to **Clients**, then **Create client**.
   - Application type: **Desktop app**. Name: `BTG Stats`. Click **Create**.
4. A box shows a **Client ID** and **Client secret**. Leave it open.
5. In your `team-workspace` folder, open the file `.env` with Notepad. If it doesn't
   exist, copy `.env.example` and rename the copy to `.env`. Add these two lines,
   pasting your values after the `=`:

   ```
   YT_CLIENT_ID=
   YT_CLIENT_SECRET=
   ```
   Save and close Notepad.

## Part 5: Log in (the only time)
Open a terminal in the `projects/social-dashboard` folder (or ask Claude Code to run these):

```
py -m pip install -r requirements.txt
py connect_youtube.py
```

Your browser opens:
- Pick the **Behind the Greens channel**, not your personal profile, if it asks.
- If you see **"Google hasn't verified this app"**: click **Advanced**, then
  **Go to BTG Stats (unsafe)**. It's your own app, so this is expected.
- Tick both boxes if shown, then **Continue**.

The black window should print your channel name and subscriber count. 🎉

## Part 6: See it
Double-click **`refresh.bat`**. Your real dashboard opens. Bookmark it.

---

**Check it's right:** compare your subscriber count and your latest video's views with
YouTube Studio. They should match. Studio can be a few hours ahead.

**If something breaks:** run `py connect_youtube.py` again. To cut off access any time,
go to myaccount.google.com, then Security, then "Third-party apps", and remove BTG Stats.
