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

- **Live theme:** "Copy of BTG FINAL". Never write to it directly.
- **Working draft:** "Copy of BTG DRAFT" (theme ID 166536642663), a copy of
  live. Claude writes changes here via the Shopify connector; Cole previews
  and publishes. The repo's `templates/*.json` can drift from the theme
  (the theme editor changes them), so fetch the theme's copy before
  overwriting any template.
- Theme fallback photos live in Shopify Files (`btg-img-*.jpg`) and are
  referenced by full CDN URL from `btg-home.css` / `btg-about.css`. Five
  same-named `assets/btg-img-*.jpg` in the draft theme are unused leftovers.
- **The live Media Kit page renders `templates/page.json`** (the default
  page template), NOT `page.media-kit.json`. The Media Kit, Our Story and
  other pages point at template suffix "page", which falls back to
  page.json, so edit page.json for Media Kit changes. Untangling this
  (Media Kit -> page.media-kit, Our Story -> page.about) is an open item.
- **Media Kit stats** are real, from Cole's platform screenshots dated
  Jul 23 – Aug 21, 2026, and labeled with that range. Refresh them
  periodically.
- **Brand rates (set by Cole, Sep 29 2026):** 1 video $1,000 · 3 videos
  $2,500 · 5 videos $3,500 · Long-term / month-to-month: custom pricing by
  deliverable. Case studies hidden until real ones exist.
- **Homepage headline** is "Behind The Greens" (eyebrow "Golf Course
  Culture"), replacing "Golf Starts Before Dawn." per Cole.
