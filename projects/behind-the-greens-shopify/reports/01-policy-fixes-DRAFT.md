# Policy fixes — DRAFT for Cole to approve

Nothing here is live. My Shopify access can read policies but not edit them,
so you paste these in yourself once you're happy with them.

**Where:** Shopify admin → **Settings → Policies**. Click a policy, edit, Save.

---

## 1. Privacy Policy — 🔴 do this first

**Problem:** the "Contact" section at the bottom shows your home street
address to anyone. That breaks your own rule.

**Fix:** delete the address lines in that section and replace the whole
Contact section with:

> **Contact**
> Should you have any questions about our privacy practices or this Privacy
> Policy, or if you would like to exercise any of the rights available to you,
> please email us at [YOUR STORE EMAIL].

Use the same email that's in **Settings → General → Store contact email**.
Nothing else in the policy needs changing.

**Related:** your shipping location's *name* is also your home address.
Customers don't usually see it, but it can show on packing slips and in some
apps. Rename it: **Settings → Locations →** click the location → change
**Location name** to something like `BTG Hat Stock` → Save. Changing the name
does not change where orders ship from.

---

## 2. Refund Policy — keeps the 30-day returns

**Problem:** it still says `[INSERT RETURN ADDRESS]`.

**Fix (no address published):** replace the sentence that contains
`[INSERT RETURN ADDRESS]` with:

> To start a return, email us at [YOUR STORE EMAIL] with your order number.
> If your return is accepted, we'll send you return instructions and, where
> applicable, a return shipping label. Items sent back to us without first
> requesting a return will not be accepted.

Everything else (30 days, unworn, tags on, etc.) stays as it is.

**Needs Cole:** where returns physically go (your place for hats? Tapstitch
for apparel?). The email-first approach means you never publish an address,
but you need an answer for when someone does return something.

---

## 3. Terms of Service — template blanks

| Find | Replace with |
|---|---|
| Each `[LINK]` | A link to the policy named right before it: Privacy → `/policies/privacy-policy`, Refund/Returns → `/policies/refund-policy`, Shipping → `/policies/shipping-policy`, Terms → `/policies/terms-of-service` |
| `[NOTE TO MERCHANT …]` line | Delete the whole note |
| `[INSERT TRADING NAME]` | `Behind The Greens` |
| `[INSERT BUSINESS ADDRESS]` | Delete the line (email contact is enough; never your home address) |
| `[INSERT BUSINESS PHONE NUMBER]` | Delete the line, or use a business-only number if you get one |
| `[INSERT BUSINESS REGISTRATION NUMBER]` | Delete, or your LLC/business number if you have one — **needs Cole** |
| `[INSERT VAT NUMBER]` | Delete (US business, not VAT-registered) — **needs Cole to confirm** |
| Contact email | [YOUR STORE EMAIL] |

The Shipping Policy link only works once you create policy #4 below.

**Also check:** Settings → Policies → **Contact information** shows a phone
number publicly. If that's your personal cell, remove it.

---

## 4. Shipping Policy — new (you don't have one yet)

Built only from how your store is actually set up. Fill in each
`[NEEDS COLE]` before publishing.

> **Shipping Policy**
>
> **Where we ship.** We ship within the United States and to many countries
> worldwide. Available options and costs for your address are shown at
> checkout before you pay.
>
> **Made to order.** Our apparel (tees, long sleeves, hoodies, polos and
> jackets) is printed to order by our production partner. Hats and
> accessories ship from our own stock.
>
> **Processing time.** Apparel: [NEEDS COLE — e.g. Tapstitch's production
> time] business days before it ships. Hats: [NEEDS COLE] business days.
>
> **Orders with apparel and hats may arrive in separate packages.** Because
> they ship from different places, you may receive more than one delivery and
> more than one tracking number. You are only charged the shipping shown at
> checkout.
>
> **Delivery times.** Once shipped, delivery times depend on the carrier and
> destination. [NEEDS COLE — typical US and international windows, only if you
> know them.]
>
> **Tracking.** You'll get a shipping confirmation email with tracking for each
> package once it ships.
>
> **International orders.** Customs duties, taxes or import fees may be charged
> by your country and are the buyer's responsibility unless shown as included
> at checkout. [NEEDS COLE — confirm whether you collect duties at checkout.]
>
> **Problems.** If a package is lost, damaged, or something is wrong with your
> order, email us at [YOUR STORE EMAIL] with your order number.

Where: **Settings → Policies → Shipping policy** → paste → Save. The footer and
product pages already link to it automatically once it exists.
