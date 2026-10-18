# Analytics & attribution — setup guide

## What I found (from your real orders)

- 6 orders so far: 3 from Instagram, 1 from the Shop app, 2 with no source
  (one is a $0 order, one is your very first order).
- No order has used tracking links (UTMs) yet, so Shopify can only guess where
  people came from.
- Google & YouTube channel: **installed**.
- Facebook & Instagram channel: **not installed**, so there is no Meta Pixel.
- I can't see or change pixels, Customer Events or consent settings with my
  access. Those steps are below for you.

## 1. Tracking links (UTMs) — free, start today

A UTM is a tag on the end of a link that tells Shopify where a visitor came
from. Use this format every time:

```
?utm_source=<platform>&utm_medium=<placement>&utm_campaign=<name>
```

| Part | Allowed values |
|---|---|
| utm_source | `instagram`, `facebook`, `youtube`, `tiktok`, `email` |
| utm_medium | `bio` (profile link), `story`, `social` (post caption / comment), `video` (YouTube description), `email` |
| utm_campaign | short, lowercase, dashes: `evergreen`, `hat-drop`, `prairie-vista`, `spring-launch` |

**Ready-made links (copy and paste):**

- Instagram bio: `https://behindthegreens.com/?utm_source=instagram&utm_medium=bio&utm_campaign=evergreen`
- TikTok bio: `https://behindthegreens.com/?utm_source=tiktok&utm_medium=bio&utm_campaign=evergreen`
- Facebook page: `https://behindthegreens.com/?utm_source=facebook&utm_medium=bio&utm_campaign=evergreen`
- YouTube descriptions: `https://behindthegreens.com/collections/all?utm_source=youtube&utm_medium=video&utm_campaign=<video-name>`
- Hat link in a story: `https://behindthegreens.com/products/behind-the-greens-performance-hat?utm_source=instagram&utm_medium=story&utm_campaign=hat-drop`
- Media Kit for brands: `https://behindthegreens.com/pages/media-kit?utm_source=email&utm_medium=email&utm_campaign=brand-outreach`

Rule of thumb: never post a bare link again. Always add the tag.

## 2. Google Analytics 4 (GA4)

1. Admin → **Sales channels → Google & YouTube**.
2. Check that a Google account and a **GA4 property** are connected. If it
   says "Connect", follow the steps. It's free.
3. Check that the **Google tag / conversion tracking** is on.
4. Don't add a GA4 code by hand to the theme as well. That double-counts.

## 3. Meta Pixel (Facebook & Instagram)

1. Admin → **Apps → Shopify App Store** → install **Facebook & Instagram**
   (by Meta). It's free and made by Shopify.
2. Log in with the Facebook account that runs the MrGreenskeeper page.
3. Turn on **Data sharing**, set to **Maximum** (pixel plus Conversions API).
4. Optional: turn on the **Instagram Shop / catalog**. Your product data
   (titles, descriptions, categories, alt text, structured data) is now
   complete enough for it.

This is your call because it means logging into your Meta accounts.

## 4. Customer Events & consent

- Admin → **Settings → Customer events**. Check that only Shopify's own pixels
  (Google & YouTube, and Meta once installed) are listed. Remove anything you
  don't recognise.
- Admin → **Settings → Customer privacy**. Keep the cookie banner on for
  regions that need it. Shopify handles consent for its own pixels
  automatically.

## 5. Dashboard (what to check every Monday)

All built in: **Analytics → Reports**. No paid apps needed.

| Metric | Report | Why it matters |
|---|---|---|
| Sessions by referrer | Sessions by referrer | Which platform sends visitors |
| Sales by referrer / UTM | Sales by referrer, Sales attributed to marketing | Which platform sends buyers |
| Conversion rate | Online store conversion over time | % of visitors who buy |
| Add-to-cart rate | Online store conversion (funnel) | Do product pages persuade? |
| Checkout abandonment | Abandoned checkouts | Lost sales to recover |
| Average order value | Average order value over time | Are bundles working? |
| Top products | Sales by product | What to restock / feature |

Pin **Sales attributed to marketing** and **Sessions by referrer** to the
Analytics overview.
