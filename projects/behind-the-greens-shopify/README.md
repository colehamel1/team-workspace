# Behind The Greens — Horizon theme implementation

This package converts the approved design system into real Shopify
Liquid: sections, snippets, JSON templates, CSS and JS. **Nothing here
touches your live theme.** It's built to be installed into a
**duplicate (draft) copy** of your Horizon theme, so you can preview
and test everything before anyone else sees it.

---

## If you already installed the earlier version of this package

You don't need to start over. Your draft theme already has the shop,
product, About, Media Kit, and Stories pages working correctly. This
version fixes the one thing that was genuinely broken (header/footer)
and adds the new homepage sections. Do just this:

1. **Re-drop the `sections` folder** (drag all files onto "sections"
   in the code editor, same as before, confirm replace when asked) —
   picks up the new `btg-video.liquid` and
   `btg-partnerships-teaser.liquid`, and the corrected
   `btg-header.liquid` / `btg-footer.liquid`.
2. **Re-drop the `assets` folder** the same way — picks up the updated
   `btg-base.css` / `btg-home.css` and the new `btg-entrance.js`.
3. **Re-drop `snippets/btg-entrance.liquid`.**
4. **Replace `templates/index.json`** — open it, Ctrl+A, Delete, and
   paste in the new version from this package (same "select all,
   delete, paste, save" move you already did for `index.json` /
   `product.json` / `collection.json` last time — pre-existing files
   silently don't get overwritten by drag-and-drop).
5. **Undo the color-scheme detour**: on the native "Header" and
   "Footer" sections in the theme editor, you can leave the color
   scheme as whatever it was originally — it no longer matters, because
   step 6 replaces those native sections with ours entirely.
6. **Do the `layout/theme.liquid` edit below** — this is the real fix.

Everything else (Media Kit, About, Stories, Shop, Product, Cart) is
untouched and stays exactly as it is.

---

## The one core-file edit: `layout/theme.liquid`

Horizon's Header and Footer "section groups" only accept Horizon's own
built-in sections through the theme editor's "Add section" picker —
custom sections don't show up there no matter how they're configured.
The reliable fix is to render our header and footer directly in the
theme's layout file instead of going through that picker.

1. In the code editor, press **Ctrl+P**, type `theme.liquid`, open
   **layout/theme.liquid**.
2. Press **Ctrl+F**, search for `header-group`. You'll land on a line
   that looks like:
   ```liquid
   {% sections 'header-group' %}
   ```
   Replace that whole line with:
   ```liquid
   {% section 'btg-header' %}
   ```
3. Search for `footer-group`. Replace that line the same way with:
   ```liquid
   {% section 'btg-footer' %}
   ```
4. Just above the closing `</body>` tag, add these two lines:
   ```liquid
   {% section 'btg-cart-drawer' %}
   {% if template == 'index' %}{% render 'btg-entrance' %}{% endif %}
   ```
5. Save with **Ctrl+S**.

That's it — header, footer, cart drawer, and the branded entrance are
now wired in directly, permanently on-brand, with nothing left to
configure through the customizer.

*(If your theme.liquid doesn't literally contain the text
`header-group`/`footer-group` — Shopify has a couple of variations —
search instead for `<header` and `<footer`, or send me a screenshot of
the relevant lines and I'll give you the exact replacement.)*

---

## Full file list (fresh install)

```
assets/
  btg-base.css            global tokens, header, footer, branded entrance, product card
  btg-home.css             hero, fork, video, shop teaser, partnerships, quote, about-teaser
  btg-shop.css              collection grid, filter chips
  btg-product.css           product page (gallery, swatches, accordion)
  btg-cart.css              cart drawer
  btg-media-kit.css         all 9 media kit sections
  btg-about.css             all 5 about-page sections
  btg-stories.css           stories index + article cards
  btg-theme.js              mobile nav
  btg-entrance.js           branded entrance dismiss logic
  btg-product-form.js       variant selection + add to cart
  btg-cart-drawer.js        cart drawer open/close + live AJAX updates

snippets/
  btg-styles.liquid           loads fonts + base CSS
  btg-section-heading.liquid  shared eyebrow + headline
  btg-product-card.liquid     shared product card (grid, teaser, cross-sell)
  btg-entrance.liquid         branded entrance markup

sections/
  btg-header.liquid, btg-footer.liquid, btg-cart-drawer.liquid   (rendered directly by theme.liquid — see above)
  btg-hero.liquid, btg-fork.liquid, btg-video.liquid,
  btg-shop-teaser.liquid, btg-partnerships-teaser.liquid,
  btg-quote.liquid, btg-about-teaser.liquid                      (homepage)
  btg-collection-grid.liquid                                     (shop)
  btg-product-main.liquid                                        (product)
  btg-about-hero/origin/values/crest/cta.liquid                  (Our Story)
  btg-stories-header.liquid, btg-stories-grid.liquid             (Stories)
  btg-mk-hero/proof/who-we-are/platforms/pathways/brands/
    courses/selected-work/closing.liquid                         (Media Kit)

templates/
  index.json              homepage
  collection.json          shop
  product.json              product page
  page.about.json           assign to your "Our Story" page
  page.media-kit.json       assign to your "Media Kit" page
  blog.stories.json         assign to your "Stories" blog
```

## Steps I couldn't automate (no live store access from here)

1. **`layout/theme.liquid` edit** — above, the one required step.
2. **Pages, Blog, and navigation:**
   - Create a Page **"Our Story"**, template `page.about`.
   - Create a Page **"Media Kit"**, template `page.media-kit`.
   - Create a Blog, handle **`stories`**, template `blog.stories`.
   - Set your **Main menu**: Shop / Stories / Media Kit / About.
3. **Two new collections for the homepage split:**
   - Create collection **"BTG Merch"**, handle `btg-merch` — assign
     your officially-branded item(s) (currently: the Ground Crew
     Performance Hat, the only piece carrying the real embroidered
     crest).
   - Create collection **"For The Crew"**, handle `for-the-crew` —
     assign the broader apparel line (tees, long sleeve, hoodie, polo,
     jacket).
   - The homepage's two teaser sections are already pointed at these
     exact handles — as soon as the collections exist with products in
     them, real products appear automatically, no section edits needed.
   - Until you create them, those two sections show a small "choose a
     collection" note instead of an empty block — never broken-looking,
     never fake products.

## What's fully dynamic vs. what needs your input

**Pulls live from Shopify everywhere — no hardcoding:** product
titles, images, prices, variants, options, color swatches (via
Shopify's native swatch config on the Color option), inventory/
availability, cart contents, fabric/material specs (from your
`product.metafields.shopify.*` fields), collection contents, blog
articles, navigation menus, footer menus, newsletter signup (native
`customer` form, tagged "newsletter" — no app).

**Needs your input via the theme editor (placeholder by design, per
your instruction not to invent anything):** every Media Kit statistic,
rate, package price, and case-study field; hero/video/fork background
images (each degrades to an intentional dark gradient, never an empty
block, until you upload real photography); the video URL on the new
homepage media section (shows a "New Episodes Coming Soon" frame until
set); product page Sizing and Shipping & Returns text.

**One thing worth doing before this goes live:** your product export
shows what look like duplicate listings (the 7-color tee vs. three
single-color duplicates; two hoodie listings). Nothing here breaks if
you leave them as-is, but consider Shopify's free **Combined
Listings** app to merge the duplicates into one customer-facing
listing without touching inventory or URLs.

**Also needed for the shop filter chips and swatches to work:** tag
products with their category (e.g. "Headwear", "Tees", "Outerwear")
for the shop-page filter chips, and configure swatch colors on the
"Color" product option (Products → an item → Options → Color → set
swatches) so the color dots render real colors instead of a neutral
fallback.

## Once it's installed

Preview the duplicate theme and test the full flow on desktop and at a
phone width (the theme editor has a mobile toggle) — browse, add to
cart, change quantity, checkout redirect — before publishing anything.
Nothing goes live until you explicitly publish from Shopify admin.
