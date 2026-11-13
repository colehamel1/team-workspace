"""One-time YouTube login. Opens your browser, you approve READ-ONLY access,
and the resulting key is saved to .env (never shown on screen).

    py connect_youtube.py
"""
import sys

import envstore

SCOPES = ["https://www.googleapis.com/auth/youtube.readonly",
          "https://www.googleapis.com/auth/yt-analytics.readonly"]


def main():
    env = envstore.read()
    if not (env.get("YT_CLIENT_ID") and env.get("YT_CLIENT_SECRET")):
        sys.exit("First put YT_CLIENT_ID and YT_CLIENT_SECRET in your .env file.\n"
                 "See CONNECT_YOUTUBE.md, part 4.")
    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError:
        sys.exit("Missing a helper. Run this first:  py -m pip install -r requirements.txt")

    config = {"installed": {
        "client_id": env["YT_CLIENT_ID"], "client_secret": env["YT_CLIENT_SECRET"],
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": ["http://localhost"]}}
    print("Opening your browser. Pick the Behind the Greens CHANNEL, then click Allow.")
    print("If Google says it hasn't verified this app: click Advanced, then 'Go to ... (unsafe)'.")
    print("That's expected. It's your own private app.\n")
    flow = InstalledAppFlow.from_client_config(config, SCOPES)
    creds = flow.run_local_server(port=0, prompt="consent", access_type="offline",
                                  success_message="Connected! You can close this tab and go back to the black window.")
    if not creds.refresh_token:
        sys.exit("Google didn't hand back a long-lasting key. Run this again and click Allow.")
    envstore.update("YT_REFRESH_TOKEN", creds.refresh_token)

    from platforms import youtube
    result = youtube.fetch(envstore.read())
    a = result["account"]
    print(f"Connected to: {a['name']}")
    print(f"Subscribers: {a['followers']:,}" if a["followers"] is not None else "Subscribers: hidden")
    print(f"Videos found: {len(result['posts'])}")
    for w in result["warnings"]:
        print("Note:", w)
    print("\nDone. Your YouTube key is saved in .env. Next: double-click refresh.bat")


if __name__ == "__main__":
    main()
