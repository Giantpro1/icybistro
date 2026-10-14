# Icy Blast Bistro & Bistro 24 Café — website demo

A static, framework-free demo site (HTML5, Bootstrap 5, custom CSS, vanilla JS). **It is a prototype:** orders, reservations and enquiries are not sent anywhere and no payment is taken. Every form says so on screen.

## Run it
```
cd restaurant-demo
python3 -m http.server 8000      # then open http://localhost:8000
```
Opening `index.html` directly also works, but use a server for video playback.

## Deploy
Drag the folder into Vercel / Netlify / Cloudflare Pages (no build step). `source-originals/` is for your records; delete it from the deployed copy if you don't want the raw files public.

## Edit content
- **Everything editable is in `assets/js/menu-data.js`:** brands, TikTok links, contact details, delivery fee, categories, menu items and prices.
- Contact details (`CONFIG.contact`) are `null` until confirmed; phone/WhatsApp/email/map only render once you fill them in.
- `price: null` → "Price to be confirmed" (excluded from totals). `variants: [{label, price}]` → size options.
- Flags: `conflict` (supplied menu images disagree), `single-source`, `borrowed` (price taken from the Bistro 24 menu).
- New photo: add `name.webp` and `name-sm.webp` to `assets/images/`, add its size to `assets/js/asset-manifest.js`, then set `image: 'name'` on the item.

## Assets
| Asset | Source | Used for |
|---|---|---|
| `assets/videos/hero-tour.*`, `kitchen-wings.*` | Clips cut from the supplied Bistro 24 Café video (576×1024, MP4 + WebM fallback) | Hero, "Inside" section |
| `assets/images/venue-*`, `kitchen-*` | Stills from that video, 2× upscaled | Gallery, concepts, hero poster |
| `assets/images/food-*`, `drink-*` | Supplied dish screenshots, 2× upscaled | Menu, Family Tower, gallery |
| `assets/images/logo-icy-blast*` | Supplied logo, circle-cropped | Header, cards |
| `source-originals/` | Untouched supplied files, incl. the three menu images | Reference only |

Upscaling is a neural 2× enlargement (LapSRN), not new detail. The source is low-resolution video, so fine detail stays soft; replace with original camera photos when the owner has them. The Bistro 24 Café logo was not supplied, so the header uses a typographic "24" placeholder.

## Open questions for the owner
1. Which concept owns which dishes? The supplied price menu is titled "24 Bistro 24 Café" but lists burgers and chicken & chips; the dish photos sit on "Yummy!" tray liners. Confirm the photos are theirs.
2. Prices where the three supplied menus disagree (milkshakes, red velvet, banana bread, Biscoff & Baileys) are flagged on-site.
3. Real address, phone/WhatsApp, opening hours, delivery fee and the Bistro 24 logo.
4. Family Tower contents and price (shown as provisional).
5. Tacos, shawarma and coffee categories were left out because no menu evidence was supplied.

## Connect a backend later
`main.js` has a `services` object (section 2) with `submitOrder`, reservation, enquiry and contact stubs that currently just resolve after a delay. Replace those with `fetch()` calls to your API, a WhatsApp deep link (`wa.me`), or a payment provider's checkout. The UI, validation and cart need no changes.
