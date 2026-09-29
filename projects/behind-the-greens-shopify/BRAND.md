# Behind The Greens — Brand & Project Reference

Read this first, every session. It's the stuff that would otherwise take
an hour of re-explaining or re-scraping the conversation history to
recover.

## What Behind The Greens is

A golf **media and culture brand** with commerce built in — NOT a merch
store, NOT a landscaping/turf-supply company. It covers the side of golf
almost nobody films: course maintenance crews, agronomy, the culture and
craft behind every playable fairway. The apparel line is an extension of
that media brand, not the point of it.

Ecosystem framing (use this when structuring anything new): **Media →
Culture → Community → Commerce**. Content builds the audience, the Media
Kit monetizes attention (brand partnerships + premium course features),
the shop gives the audience something to wear.

**Avoid:** country-club/preppy clichés, playful golf-graphic merch vibes,
anything that reads as a landscaping/turf-supply business.

## Visual identity (approved — do not redesign without being asked)

**Palette:**
| Token | Hex | Use |
|---|---|---|
| ink | `#14140F` | primary dark / header / footer |
| forest | `#163A2B` | secondary dark green |
| forest-deep | `#0F2A1F` | darkest green, hero/quote backgrounds |
| fairway | `#4C7A4A` | mid green accent |
| cream | `#F3EEDF` | primary light / body background |
| cream-soft | `#EDE6D2` | secondary light, card backgrounds |
| sand | `#C9B896` | earth neutral |
| clay | `#A5402C` | muted red accent (used sparingly) |
| ochre | `#C1922F` | muted gold accent — primary CTA color |

Real logo: a circular heritage-badge crest (groundskeeper silhouette,
mountain, sun, "BEHIND THE GREENS / GOLF COURSE MAINTENANCE CO" arched
text) — reads closer to a National Park Service / vintage workwear patch
than a golf-merch logo. This is intentional and central to the tone.

**Typography (Google Fonts):**
- Display/headline: **Big Shoulders Display** (700–900 weight, uppercase)
- Editorial/quotes: **Newsreader** (italic)
- Body/UI: **Public Sans**

Never Inter, Roboto, or Fraunces for this brand (all flagged as
overused/generic in the design pass).

**Tone:** confident, editorial, cinematic — large photography, restrained
copy, whitespace doing the work. Reduce repetitive brand-philosophy copy;
let photography/products/whitespace carry it.

## Key approved copy

- Hero: **"Golf Starts Before Dawn."**
- Shop tagline: **"Built for the people who show up before the flag
  does."**
- Manifesto line (quote break): *"You can walk a hundred golf courses and
  never see the people who made them playable. We started Behind The
  Greens to change that."* — attributed to "The Behind The Greens Crew"
  (collective brand voice, not a fabricated individual).

## Product catalog (real Shopify data, from CSV export)

10 listings currently in Shopify; **treat as-is, don't silently
merge/rename** — that's the merchant's call, not ours:
- Ground Crew Performance Hat — $35 (the only item with the real
  embroidered crest logo)
- Essential Cotton T-Shirt — $30 (master, 7 colors) **+ 3 single-color
  duplicate listings** (Black/Apricot/Dark Gray) that overlap the
  master's own colors — flagged to Cole as a likely POD-import cleanup
  item, not fixed unilaterally
- Heavyweight Long Sleeve T-Shirt — $35 (2 colors)
- Oversized Drop Shoulder Hoodie — $50 (master, 6 colors) **+ 1
  duplicate** Black-only listing
- Regular Fit Golf Polo — $40 (3 colors)
- Soft Hooded Sports Jacket — $55 (3 colors)

Generic supplier product titles (e.g. "Essential Cotton T-Shirt") are
real and current — Cole may want to give each a branded name later,
keeping specs in the description. Don't rename without being asked.

**Homepage split (in progress):** two collections need creating in
Shopify — `BTG Merch` (officially branded, currently just the hat) and
`For The Crew` (the broader line) — see this project's README.md for
exact setup steps.

## What's real vs. placeholder — never blur this line

Everything product/price/image/inventory/cart-related pulls live from
Shopify — zero hardcoding anywhere in the theme code.

Media Kit stats, rates, case studies, and audience demographics are
**all placeholder by explicit instruction** — bracketed
(`[XXX,XXX]`, `[Rate On Request]`, `[Name]`) until Cole supplies verified
numbers. **Never invent audience stats, engagement rates, follower
counts, pricing, or past collaborations for this brand — not even
draft/illustrative ones that could be mistaken for real.**

## Where things stand

- Full custom Shopify Horizon theme implementation lives in this folder
  (`sections/`, `snippets/`, `assets/`, `templates/`) — see `README.md`
  in this same folder for the install process into Cole's draft
  ("Copy of Horizon") theme, including the `layout/theme.liquid` edit
  that wires the header/footer/cart-drawer/entrance directly (Horizon's
  native header/footer section groups reject custom sections through
  the theme editor's picker — confirmed, this was the fix).
- Shopify store: `a4qv04-wy.myshopify.com`.
- Header/footer, homepage (11 sections incl. branded entrance + video +
  BTG Merch/For The Crew split + partnerships strip), Shop, Product
  template, Cart drawer, About/Our Story, Media Kit (9 sections,
  restructured around Brand Partnerships vs. Course Features pathways),
  Stories (native Shopify Blog, handle `stories`) are all built.
- Still open on Cole's side: navigation menu finish, Media Kit/Our Story
  page template assignment (Shopify's Page admin only shows *published*
  theme templates — has to be set from inside the *theme editor's* own
  page picker instead, for a draft theme), Stories blog creation, the
  two collections above, and real photography/video uploads (everything
  degrades gracefully to an intentional dark-gradient placeholder until
  then, never an empty-looking block).

## Themes & install (as of Sep 29, 2026)

- **Live theme:** "Copy of BTG FINAL". Never written to directly.
- **Working draft:** "Copy of BTG DRAFT" (theme ID 166536642663). Claude
  uploads here; Cole previews and publishes. Upload method: push to this
  repo, then `themeFilesUpsert` with URL bodies pointing at
  raw.githubusercontent.com/<commit sha>/... (verify with checksumMd5;
  JSON templates get a Shopify header so compare those by content).
  Always re-fetch the draft's files first: the theme editor changes
  templates, and this repo can drift.
- **Premium redesign (Sep 29, 2026):** design system in `assets/btg-base.css`
  (tokens, type scale, square buttons: ink on light / cream on dark,
  4:5 product cards, sticky header with Shop / Stories / Our Story /
  Work With Us, footer with official socials). Brand fonts are also
  pushed into Horizon's native pages via the `<style>` block in
  `layout/theme.liquid`. The intro splash was removed; the email popup
  waits 15s+ and shows at most once per 30 days.
- **Page routing:** Our Story and Media Kit pages both use template suffix
  "page", so they render `templates/page.json`. Sections in it carry an
  `only_on_page` setting (our-story / media-kit), and `btg-page-main`
  hides itself on those two handles, so each page shows only its own
  content and every other page (e.g. Your Privacy Choices) shows plain
  content. `page.about.json` / `page.media-kit.json` mirror the same
  content if the pages are ever switched to dedicated templates.
- **Official socials:** instagram.com/behind_thegreens,
  facebook.com/MrGreenskeeper, tiktok.com/@behind_thegreens,
  youtube.com/@behind_thegreens.
- **Media Kit stats** are real, from Cole's platform screenshots dated
  Jul 23 – Aug 21, 2026 (also used in the homepage / Our Story proof
  strip: 380K+ followers = sum of per-platform counts). Refresh them
  periodically.
- **Brand rates (set by Cole, Sep 29 2026):** 1 video $1,000 · 3 videos
  $2,500 · 5 videos $3,500 · Long-term / month-to-month: custom pricing by
  deliverable. Case studies hidden until real ones exist.
- **Homepage headline** is "Behind The Greens" (eyebrow "Golf Course
  Culture"), replacing "Golf Starts Before Dawn." per Cole.
- **No invented facts:** product pages show no shipping-time promise
  (checkout shows it) and no size chart unless real measurements are
  entered in the product section's Size & Fit setting. "30-day returns"
  comes from the store's own refund policy.

## Second creative pass (Sep 29, 2026)

Priority order from Cole: 1) "I want that gear" 2) "This content is sick"
3) "I've never seen a golf website like this." Every addition must serve
that order; nothing that only makes the site "fancier".

- **Lifestyle images:** product metafields `custom.lifestyle_image` (file)
  and `custom.lifestyle_caption` (text), pinned on each product in admin.
  Card hover crossfades to it (desktop), two-frame swipe on touch, and it
  joins the PDP gallery with an "On The Job" tag. Fallback: a product image
  whose alt text starts with "Lifestyle". Images must be believable
  documentary shots of the exact product; no invented branding.
- **Films:** `sections/btg-films.liquid` (homepage `#watch-the-work`, and on
  Work With Us as "What A Feature Looks Like"). One block per film:
  course, location (only when confirmed), YouTube link. YouTube loads only
  on play. Films without a link open the channel. As of this pass the five
  YouTube links were NOT yet provided (Cole's message lost them).
  Locations entered from general knowledge and flagged for Cole to confirm:
  Prairie Vista (Bloomington, IL), Oahu CC (Honolulu, HI), Forty Niner CC
  (Tucson, AZ), TPC Scottsdale (Scottsdale, AZ); Eagle Mountain left blank.
- **Stories = "Field Notes" journal:** entry numbers derived from blog
  order (No. 01 = first ever), "Filed" times are real publish times.
- **Homepage order:** hero (Shop + gold Watch The Work) -> Made For The
  Course -> Films (+ "The Uniform" gear row) -> manifesto -> Golf Has A
  Back Of House -> compact dated proof -> Work With Us.
- Homepage follower figure is Cole's own edit (450K+); per-platform media
  kit follower counts still sum to ~389K — reconcile with Cole.
