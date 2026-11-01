# Icyblast Bistro — website demo

Static site (Bootstrap 5, HTML, CSS, vanilla JS). No build step.

## Run
Needs `../shared/` next to this folder. From the project root: `python3 -m http.server 8000`, then open `http://localhost:8000/icyblast/`. Double-clicking index.html also loads the page (tested), but use the local server for presenting: font preloads log harmless warnings over file://

## Present
Scroll-built 3D burger hero (it floats apart, stacks as you scroll, and separates again when you scroll back) → three signature plates (quick add) → Family Tower → menu (filters, search, cart, demo checkout) → reservations → events → gallery → contact. Say clearly that prices are placeholders and nothing is sent anywhere.

## Edit
- `js/data.js`: all business content (contact, categories, items, prices, gallery). Replace `demoPrice` with `price` once confirmed.
- `css/brand.css`: colours, fonts, layout personality.
- `assets/images/` + `js/asset-manifest.js`: photos (regenerate the manifest after adding images).

## Missing from the owner
Real prices and full menu · allergen/ingredient info · address, hours, phone/WhatsApp/email · venue photos · hero video · rights to use the logo and the food photos · confirmation of dish names (all provisional) and of the tagline (placeholder).

## The 3D burger
- Procedural Three.js (r149, vendored in `assets/vendor/`), code in `js/burger.js`. No images or video needed; every layer is modelled in code.
- It is an **illustrative stack** (bun, 2 patties, 2 cheese, lettuce, tomato, pink sauce, sesame bun), not Icyblast's confirmed recipe. Edit `LAYERS` in `burger.js` to change it.
- Fallbacks: no WebGL shows the double-burger photo; reduced-motion users get the finished burger with no scroll runway.
- Upgrade path: a Higgsfield/photoreal clip can replace the canvas later without touching the rest of the page.
