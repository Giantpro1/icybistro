/* ==========================================================================
   main.js — application logic (vanilla ES6+, no dependencies besides Bootstrap's JS)
   One engine, two independent sites: each brand folder supplies its own data.js (RD_DATA). Backend hooks live in `services` below.
   Sections:
   1  Utilities            6  Cart & checkout         11 Reveal on scroll
   2  Services (backend)   7  Demo forms              12 Boot
   3  State                8  Gallery & lightbox
   4  Menu filters         9  Hero & kitchen video
   5  Menu                 10 Navigation & contact
   ========================================================================== */
(function () {
  'use strict';

  const { CONFIG, CATEGORIES, ITEMS, FLAG_TEXT, GALLERY, GALLERY_FILTERS } = window.RD_DATA;
  const BRAND = CONFIG.brand;
  const ASSETS = window.RD_ASSETS || {};
  const ITEM_MAP = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1 — Utilities ---------------------------------------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /** Safe element builder: text is always added as text nodes, never as HTML. */
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }

  const fmt = (n) => CONFIG.currencySymbol + Math.round(n).toLocaleString('en-US');
  const plural = (n, one, many) => (n === 1 ? one : many);
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const store = {
    get(key, fallback) { try { const v = localStorage.getItem('rd.' + BRAND.key + '.' + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(key, val) { try { localStorage.setItem('rd.' + BRAND.key + '.' + key, JSON.stringify(val)); } catch (e) { /* storage unavailable: demo still works */ } }
  };

  function toast(message, icon = 'bi-check2-circle') {
    const stack = $('#toasts');
    while (stack.children.length >= 3) stack.firstElementChild.remove();
    const item = h('div', { class: 'toast-item' }, h('i', { class: 'bi ' + icon, 'aria-hidden': 'true' }), h('span', { text: message }));
    stack.append(item);
    setTimeout(() => { item.classList.add('is-out'); setTimeout(() => item.remove(), 350); }, 2600);
  }

  /** Builds a responsive <img> from the asset manifest (small + full variants). */
  function picture(name, alt, sizes, extra = {}) {
    const meta = ASSETS[name];
    const props = Object.assign({ alt, loading: 'lazy', decoding: 'async' }, extra);
    if (meta) {
      props.src = `assets/images/${name}-sm.webp`;
      props.srcset = `assets/images/${name}-sm.webp ${meta.sw}w, assets/images/${name}.webp ${meta.w}w`;
      props.sizes = sizes;
      props.width = meta.sw;
      props.height = meta.sh;
    } else {
      props.src = `assets/images/${name}.webp`;
    }
    return h('img', props);
  }

  /* 2 — Services: the integration points for a real backend ---------------- */
  /* Each function receives the validated payload and returns a Promise.
     Replace the body with a fetch() to your API, a WhatsApp deep link, a payment
     provider, etc. Until then they resolve locally and nothing leaves the browser. */
  const services = {
    submitOrder(payload) { return demoDelay({ demo: true, delivered: false, payload }); },
    submitReservation(payload) { return demoDelay({ demo: true, delivered: false, payload }); },
    submitEvent(payload) { return demoDelay({ demo: true, delivered: false, payload }); },
    submitContact(payload) { return demoDelay({ demo: true, delivered: false, payload }); }
  };
  function demoDelay(result) { return new Promise((resolve) => setTimeout(() => resolve(result), 450)); }

  /* 3 — State -------------------------------------------------------------- */
  const state = {
    category: 'all',
    query: '',
    fulfilment: store.get('fulfilment', 'collection') === 'delivery' ? 'delivery' : 'collection',
    cart: sanitiseCart(store.get('cart', [])),
    customer: null,
    view: 'cart'
  };

  function sanitiseCart(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.filter((l) => l && ITEM_MAP[l.id] && Number.isInteger(l.qty) && l.qty > 0)
      .map((l) => {
        const item = ITEM_MAP[l.id];
        const variant = item.variants && item.variants.some((v) => v.label === l.variant) ? l.variant : (item.variants ? item.variants[0].label : null);
        return { key: lineKey(l.id, variant), id: l.id, variant, qty: Math.min(l.qty, 99) };
      });
  }
  const lineKey = (id, variant) => id + '|' + (variant || '');

  /* 4 — Menu filters ------------------------------------------------------ */
  function setCategory(category, opts = {}) {
    state.category = CATEGORIES.some((c) => c.id === category) ? category : 'all';
    if (opts.resetQuery) { state.query = ''; $('#menuSearch').value = ''; }
    renderCategoryChips();
    renderMenu();
  }

  function scrollToMenu() {
    const target = $('#menu');
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    const title = $('#menuTitle');
    title.setAttribute('tabindex', '-1');
    title.focus({ preventScroll: true });
  }

  /* 5 — Menu --------------------------------------------------------------- */
  const catLabel = (id) => (CATEGORIES.find((c) => c.id === id) || {}).label || '';

  function renderCategoryChips() {
    const wrap = $('#categoryChips');
    const inBrand = ITEMS;
    const make = (id, label, count) => h('button', {
      type: 'button', class: 'chip', 'aria-pressed': String(state.category === id), dataset: { cat: id },
      onclick: () => { state.category = id; renderCategoryChips(); renderMenu(); }
    }, label + ' (' + count + ')');
    wrap.replaceChildren(make('all', 'All', inBrand.length), ...CATEGORIES.map((c) => make(c.id, c.label, inBrand.filter((i) => i.cat === c.id).length)));
  }

  function matches(item, q) {
    if (!q) return true;
    const hay = (item.name + ' ' + item.desc + ' ' + catLabel(item.cat)).toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
  }

  function renderMenu() {
    const grid = $('#menuGrid');
    const q = state.query.trim();
    const list = ITEMS.filter((i) => (state.category === 'all' || i.cat === state.category) && matches(i, q));
    grid.replaceChildren(...list.map((item) => h('div', { class: 'col-sm-6 col-xl-4' }, dishCard(item))));

    const empty = $('#menuEmpty');
    empty.hidden = list.length > 0;
    grid.hidden = list.length === 0;
    const brandName = BRAND.name;
    const catText = state.category === 'all' ? 'all categories' : catLabel(state.category);
    $('#menuCount').textContent = list.length
      ? `Showing ${list.length} ${plural(list.length, 'item', 'items')} from ${brandName}, ${catText}${q ? ` matching “${q}”` : ''}.`
      : '';

    if (!list.length) {
      $('#menuEmptyText').textContent = q ? `No ${brandName} items match “${q}”.` : `There are no items in ${catText} yet.`;
    }
  }

  function dishCard(item) {
    const variantState = { label: item.variants ? item.variants[0].label : null };
    const priceFor = () => (item.variants ? item.variants.find((v) => v.label === variantState.label).price : (item.price != null ? item.price : item.demoPrice));
    const isDemo = item.price == null && item.demoPrice != null && !item.variants;
    const priceEl = h('span');
    const paintPrice = () => {
      const p = priceFor();
      priceEl.className = p == null ? 'dish__price dish__price--tbc' : 'dish__price' + (isDemo ? ' dish__price--demo' : '');
      priceEl.replaceChildren(...[p == null ? 'Price to be confirmed' : fmt(p), isDemo ? h('small', { text: 'Demo price' }) : null].filter(Boolean));
    };
    paintPrice();

    const cat = CATEGORIES.find((c) => c.id === item.cat) || {};
    const media = item.image
      ? h('div', { class: 'dish__media' }, picture(item.image, item.alt || item.name, '(min-width:1200px) 380px, (min-width:576px) 45vw, 92vw', { style: item.focus ? `object-position:${item.focus}` : null }))
      : null;

    const badges = h('div', { class: 'dish__badges' },
      item.featured ? h('span', { class: 'badge-demo', text: 'Signature' }) : null,
      item.provisional ? h('span', { class: 'badge-demo', text: 'Provisional' }) : null);

    let sizes = null;
    if (item.variants) {
      const name = 'size-' + item.id;
      sizes = h('fieldset', { class: 'sizes' }, h('legend', { text: 'Size' }),
        ...item.variants.map((v, idx) => h('label', { class: 'size-opt' },
          h('input', { type: 'radio', name, value: v.label, checked: idx === 0, onchange: () => { variantState.label = v.label; paintPrice(); } }),
          h('span', { text: `${v.label} · ${fmt(v.price)}` }))));
    }

    return h('article', { class: 'dish' + (item.image ? '' : ' dish--text'), 'aria-label': item.name },
      media,
      h('div', { class: 'dish__body' },
        badges.childNodes.length ? badges : null,
        h('h3', { class: 'dish__name' }, item.image ? null : h('i', { class: 'bi ' + (cat.icon || 'bi-circle'), 'aria-hidden': 'true' }), item.name),
        h('p', { class: 'dish__desc', text: item.desc }),
        item.info ? h('p', { class: 'dish__flag' }, h('i', { class: 'bi bi-info-circle', 'aria-hidden': 'true' }), h('span', { text: item.info })) : null,
        item.flag ? h('p', { class: 'dish__flag' }, h('i', { class: 'bi bi-exclamation-circle', 'aria-hidden': 'true' }), h('span', { text: FLAG_TEXT[item.flag] })) : null,
        sizes,
        h('div', { class: 'dish__foot' }, priceEl,
          h('button', { type: 'button', class: 'btn btn-accent btn-add', 'aria-label': `Add ${item.name} to order`, onclick: () => addToCart(item.id, variantState.label) },
            h('i', { class: 'bi bi-plus-lg', 'aria-hidden': 'true' }), ' Add'))));
  }

  /* 6 — Cart & checkout ---------------------------------------------------- */
  function priceOfLine(line) {
    const item = ITEM_MAP[line.id];
    return item.variants ? item.variants.find((v) => v.label === line.variant).price : (item.price != null ? item.price : (item.demoPrice != null ? item.demoPrice : null));
  }

  function addToCart(id, variant) {
    const key = lineKey(id, variant || null);
    const existing = state.cart.find((l) => l.key === key);
    if (existing) existing.qty = Math.min(existing.qty + 1, 99);
    else state.cart.push({ key, id, variant: variant || null, qty: 1 });
    persistCart();
    renderCart();
    toast(`${ITEM_MAP[id].name}${variant ? ' (' + variant + ')' : ''} added`);
  }

  function changeQty(key, delta) {
    const line = state.cart.find((l) => l.key === key);
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) return removeLine(key);
    line.qty = Math.min(line.qty, 99);
    persistCart();
    renderCart();
  }

  function removeLine(key) {
    const line = state.cart.find((l) => l.key === key);
    state.cart = state.cart.filter((l) => l.key !== key);
    persistCart();
    renderCart();
    if (line) toast(`${ITEM_MAP[line.id].name} removed`, 'bi-trash3');
  }

  function persistCart() { store.set('cart', state.cart.map(({ id, variant, qty }) => ({ id, variant, qty }))); }

  function computeTotals() {
    let subtotal = 0, tbcItems = 0, count = 0, demoItems = 0;
    for (const l of state.cart) {
      count += l.qty;
      const p = priceOfLine(l);
      if (p == null) tbcItems += l.qty; else { subtotal += p * l.qty; if (ITEM_MAP[l.id].price == null && !ITEM_MAP[l.id].variants) demoItems += l.qty; }
    }
    const delivering = state.fulfilment === 'delivery';
    const feeConfigured = CONFIG.deliveryFee != null;
    const fee = delivering && feeConfigured ? CONFIG.deliveryFee : 0;
    return { subtotal, tbcItems, demoItems, count, delivering, feeTbc: delivering && !feeConfigured, fee, total: subtotal + fee };
  }

  function totalsRows(t) {
    const row = (label, value, cls) => h('div', { class: cls }, h('dt', { text: label }), h('dd', { text: value }));
    const rows = [row('Subtotal', fmt(t.subtotal))];
    if (t.delivering) rows.push(row('Delivery fee', t.feeTbc ? 'To be confirmed' : fmt(t.fee)));
    rows.push(row('Total', fmt(t.total), 'grand'));
    const notes = [];
    if (t.tbcItems) notes.push(`Excludes ${t.tbcItems} ${plural(t.tbcItems, 'item', 'items')} with a price to be confirmed.`);
    if (t.demoItems) notes.push(`Includes ${t.demoItems} ${plural(t.demoItems, 'item', 'items')} at demo prices, not real prices.`);
    if (t.feeTbc) notes.push('Delivery fee is not included yet.');
    if (notes.length) rows.push(h('div', null, h('dt', { class: 'visually-hidden', text: 'Notes' }), h('dd', { class: 'tbc-note', text: notes.join(' ') })));
    return rows;
  }

  function renderCart() {
    const t = computeTotals();
    const badge = $('#cartBadge');
    badge.textContent = t.count;
    badge.dataset.empty = String(t.count === 0);
    $('#cartBadgeSr').textContent = `Order, ${t.count} ${plural(t.count, 'item', 'items')} in your demo cart`;

    $('#cartEmpty').hidden = t.count > 0;
    $('#cartFilled').hidden = t.count === 0;
    const list = $('#cartLines');
    list.replaceChildren(...state.cart.map((l) => {
      const item = ITEM_MAP[l.id];
      const p = priceOfLine(l);
      return h('li', { class: 'cart-line' },
        h('div', null, h('div', { class: 'cart-line__name', text: item.name }),
          l.variant ? h('div', { class: 'cart-line__meta', text: l.variant }) : (item.price == null && item.demoPrice != null ? h('div', { class: 'cart-line__meta', text: 'Demo price' }) : null)),
        h('div', { class: 'cart-line__price' + (p == null ? ' cart-line__price--tbc' : ''), text: p == null ? 'Price TBC' : fmt(p * l.qty) }),
        h('div', { class: 'cart-line__ctrl' },
          h('div', { class: 'qty', role: 'group', 'aria-label': `Quantity for ${item.name}` },
            h('button', { type: 'button', 'aria-label': `Decrease quantity of ${item.name}`, onclick: () => changeQty(l.key, -1) }, h('i', { class: 'bi bi-dash-lg', 'aria-hidden': 'true' })),
            h('output', { 'aria-live': 'polite', text: l.qty }),
            h('button', { type: 'button', 'aria-label': `Increase quantity of ${item.name}`, onclick: () => changeQty(l.key, 1) }, h('i', { class: 'bi bi-plus-lg', 'aria-hidden': 'true' }))),
          h('button', { type: 'button', class: 'remove-btn', 'aria-label': `Remove ${item.name} from order`, onclick: () => removeLine(l.key) }, h('i', { class: 'bi bi-trash3', 'aria-hidden': 'true' }), 'Remove')));
    }));
    $('#cartTotals').replaceChildren(...totalsRows(t));
    $$('input[name="fulfilment"]').forEach((r) => { r.checked = r.value === state.fulfilment; });
    syncDeliveryFields();
    if (state.view === 'review') renderReview();
  }

  function syncDeliveryFields() {
    const delivering = state.fulfilment === 'delivery';
    $('#deliveryFields').hidden = !delivering;
    const addr = $('#coAddress');
    addr.required = delivering;
    if (!delivering) { addr.classList.remove('is-invalid'); }
  }

  function showView(name, opts = {}) {
    state.view = name;
    $$('[data-view]').forEach((v) => { v.hidden = v.dataset.view !== name; });
    const section = $(`[data-view="${name}"]`);
    const heading = name === 'review' ? $('#reviewHeading') : name === 'done' ? $('#doneHeading') : null;
    if (opts.focus !== false) (heading || $('#cartTitle')).focus({ preventScroll: true });
    $('.offcanvas-body', $('#cartDrawer')).scrollTop = 0;
    if (name === 'review') renderReview();
    return section;
  }

  function customerLines(c) {
    const rows = [['Name', c.name], ['Phone', c.phone]];
    if (c.email) rows.push(['Email', c.email]);
    rows.push(['Fulfilment', state.fulfilment === 'delivery' ? 'Delivery' : 'Collection']);
    if (state.fulfilment === 'delivery') { rows.push(['Address', c.address]); if (c.landmark) rows.push(['Landmark', c.landmark]); }
    if (c.notes) rows.push(['Notes', c.notes]);
    return rows;
  }

  function orderBlocks(c) {
    const t = computeTotals();
    return [
      h('div', { class: 'review-block' }, h('h4', { text: 'Items' }),
        h('ul', null, ...state.cart.map((l) => {
          const p = priceOfLine(l);
          return h('li', null, h('span', { text: `${l.qty} × ${ITEM_MAP[l.id].name}${l.variant ? ' (' + l.variant + ')' : ''}` }), h('span', { text: p == null ? 'Price TBC' : fmt(p * l.qty) }));
        })),
        h('dl', { class: 'totals mt-2 mb-0' }, ...totalsRows(t))),
      h('div', { class: 'review-block' }, h('h4', { text: 'Your details' }),
        h('ul', null, ...customerLines(c).map(([k, v]) => h('li', null, h('span', { text: k }), h('span', { text: v, style: 'text-align:right;overflow-wrap:anywhere' }))))),
      h('p', { class: 'demo-banner' }, h('i', { class: 'bi bi-info-circle', 'aria-hidden': 'true' }), 'This is a website demo. Orders and payments are not yet connected to the restaurant.')
    ];
  }

  function renderReview() {
    if (!state.customer) return;
    $('#reviewBody').replaceChildren(...orderBlocks(state.customer));
  }

  function initCart() {
    $$('input[name="fulfilment"]').forEach((r) => r.addEventListener('change', () => {
      state.fulfilment = r.value; store.set('fulfilment', r.value); renderCart();
    }));
    $('#clearCart').addEventListener('click', () => { state.cart = []; persistCart(); renderCart(); toast('Order cleared', 'bi-trash3'); });
    $('#toDetails').addEventListener('click', () => { if (state.cart.length) showView('details'); });
    $$('[data-goto]').forEach((b) => b.addEventListener('click', () => showView(b.dataset.goto)));

    const form = $('#checkoutForm');
    attachLiveValidation(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(form)) return;
      const d = new FormData(form);
      state.customer = Object.fromEntries(['name', 'phone', 'email', 'address', 'landmark', 'notes'].map((k) => [k, String(d.get(k) || '').trim()]));
      showView('review');
    });

    const submit = $('#submitOrder');
    submit.addEventListener('click', async () => {
      if (!state.cart.length || !state.customer) return;
      submit.disabled = true;
      submit.textContent = 'Submitting demo order…';
      const snapshot = { customer: state.customer, blocks: null };
      snapshot.blocks = orderBlocks(state.customer).slice(0, 2);
      const payload = { lines: state.cart.map(({ id, variant, qty }) => ({ id, variant, qty })), fulfilment: state.fulfilment, customer: state.customer, totals: computeTotals() };
      try {
        await services.submitOrder(payload);
        $('#doneSummary').replaceChildren(...snapshot.blocks);
        state.cart = []; state.customer = null; persistCart(); renderCart();
        form.reset();
        showView('done');
        toast('Demo order submitted — nothing was sent', 'bi-info-circle');
      } catch (err) {
        toast('Something went wrong. Please try again.', 'bi-exclamation-triangle');
      } finally {
        submit.disabled = false;
        submit.textContent = 'Submit demo order';
      }
    });

    $('#startOver').addEventListener('click', () => showView('cart'));
    $('#cartDrawer').addEventListener('show.bs.offcanvas', () => { if (state.view === 'done') showView('cart'); });
    $('#cartDrawer').addEventListener('hidden.bs.offcanvas', () => { if (state.view === 'done') showView('cart'); });

    $$('[data-add]').forEach((b) => b.addEventListener('click', () => addToCart(b.dataset.add, null)));
  }

  /* 7 — Demo forms --------------------------------------------------------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const digits = (s) => (s.match(/\d/g) || []).length;
  const phoneOk = (s) => /^\+?[\d\s().-]{7,22}$/.test(s) && digits(s) >= 7;

  /** Returns an error message, or '' when the field is valid. */
  function fieldError(field) {
    if (field.disabled || field.closest('[hidden]')) return '';
    const v = field.value.trim();
    const custom = field.dataset.error || 'Please check this field.';
    if (field.required && !v) return custom;
    if (!v) return '';
    const rule = field.dataset.rule;
    if (rule === 'contact' && !(EMAIL_RE.test(v) || phoneOk(v))) return custom;
    if (rule === 'phone' && !phoneOk(v)) return custom;
    if (field.type === 'email' && !EMAIL_RE.test(v)) return custom;
    if (field.type === 'number') {
      const n = Number(v);
      const min = field.min !== '' ? Number(field.min) : -Infinity;
      const max = field.max !== '' ? Number(field.max) : Infinity;
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) return custom;
    }
    if (field.type === 'date' && v < todayISO()) return custom;
    if (rule === 'time-not-past') {
      const dateField = document.getElementById(field.dataset.dateField);
      if (dateField && dateField.value === todayISO()) {
        const now = new Date();
        const hhmm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        if (v < hhmm) return 'That time has already passed today.';
      }
    }
    const min = Number(field.getAttribute('minlength'));
    if (min && v.length < min) return custom;
    return '';
  }

  function paintField(field) {
    const msg = fieldError(field);
    field.classList.toggle('is-invalid', Boolean(msg));
    if (msg) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid');
    const fb = field.parentElement.querySelector('.invalid-feedback');
    if (fb) {
      fb.textContent = msg;
      if (!fb.id) fb.id = (field.id || field.name) + '-error';
      if (msg) field.setAttribute('aria-describedby', fb.id); else field.removeAttribute('aria-describedby');
    }
    return !msg;
  }

  function validateForm(form) {
    const fields = $$('input, select, textarea', form).filter((f) => f.name);
    let firstBad = null;
    for (const f of fields) { if (!paintField(f) && !firstBad) firstBad = f; }
    if (firstBad) { firstBad.focus(); firstBad.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'auto' : 'smooth' }); }
    return !firstBad;
  }

  function attachLiveValidation(form) {
    form.addEventListener('focusout', (e) => { if (e.target.name) paintField(e.target); });
    form.addEventListener('input', (e) => { if (e.target.classList.contains('is-invalid')) paintField(e.target); });
    form.addEventListener('change', (e) => { if (e.target.name && e.target.type === 'date') { paintField(e.target); const t = form.querySelector('[data-rule="time-not-past"]'); if (t && t.value) paintField(t); } });
  }

  const labelOf = (form, field) => {
    const lab = form.querySelector(`label[for="${field.id}"]`);
    return lab ? lab.childNodes[0].textContent.trim() : field.name;
  };

  function initDemoForm(form, cfg) {
    const card = form.parentElement;
    const original = Array.from(card.childNodes);
    $$('input[type="date"]', form).forEach((d) => { d.min = todayISO(); });
    const timeField = $('input[type="time"]', form);
    const dateField = $('input[type="date"]', form);
    if (timeField && dateField) { timeField.dataset.rule = 'time-not-past'; timeField.dataset.dateField = dateField.id; }
    attachLiveValidation(form);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(form)) return;
      const btn = $('button[type="submit"]', form);
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Submitting demo…';
      const fields = $$('input, select, textarea', form).filter((f) => f.name && f.value.trim());
      const payload = Object.fromEntries(fields.map((f) => [f.name, f.value.trim()]));
      try {
        await services[cfg.service](payload);
        const result = h('div', { class: 'demo-result', role: 'status' },
          h('i', { class: 'bi bi-check2-circle big', 'aria-hidden': 'true' }),
          h('h3', { class: 'h4', tabindex: '-1', text: cfg.title }),
          h('p', null, h('strong', { text: 'Nothing has been sent. ' }), cfg.text),
          h('dl', null, ...fields.flatMap((f) => [h('dt', { text: labelOf(form, f) }), h('dd', { text: f.value.trim() })])),
          h('button', { type: 'button', class: 'btn btn-ghost-dark', text: cfg.again, onclick: () => {
            form.reset();
            $$('.is-invalid', form).forEach((f) => f.classList.remove('is-invalid'));
            card.replaceChildren(...original);
            $('input, select, textarea', form).focus();
          } }));
        card.replaceChildren(result);
        $('h3', result).focus({ preventScroll: true });
        result.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
        toast(cfg.toast, 'bi-info-circle');
      } catch (err) {
        toast('Something went wrong. Please try again.', 'bi-exclamation-triangle');
      } finally {
        btn.disabled = false; btn.textContent = label;
      }
    });
  }

  function initForms() {
    initDemoForm($('#reservationForm'), {
      service: 'submitReservation', title: 'Demo request recorded on this page only',
      text: 'The restaurant has not received this request and no table has been held or confirmed.',
      again: 'Make another demo request', toast: 'Demo reservation — nothing was sent'
    });
    initDemoForm($('#eventForm'), {
      service: 'submitEvent', title: 'Demo enquiry shown on this page only',
      text: 'The business has not received this enquiry. In the live version it would reach the owner.',
      again: 'Make another demo enquiry', toast: 'Demo enquiry — nothing was sent'
    });
    initDemoForm($('#contactForm'), {
      service: 'submitContact', title: 'Demo message shown on this page only',
      text: 'This message has not been delivered to anyone.',
      again: 'Write another demo message', toast: 'Demo message — nothing was sent'
    });
  }

  /* 8 — Gallery & lightbox ------------------------------------------------- */
  const lb = { dlg: null, list: [], index: 0, trigger: null };

  function initGallery() {
    let active = 'all';
    const grid = $('#galleryGrid');
    const filters = $('#galleryFilters');
    const items = GALLERY.map((g, i) => {
      const meta = ASSETS[g.name] || {};
      const btn = h('button', { type: 'button', class: 'gallery__item', 'aria-label': `Enlarge photo: ${g.caption}`, dataset: { cat: g.cat, i } },
        picture(g.name, g.alt, '(min-width:1200px) 23vw, (min-width:768px) 31vw, 47vw'),
        h('span', { class: 'gallery__cap', text: g.caption }));
      btn.addEventListener('click', () => openLightbox(btn));
      return btn;
    });
    grid.replaceChildren(...items);

    const paint = () => {
      filters.replaceChildren(...GALLERY_FILTERS.map(([id, label]) => h('button', {
        type: 'button', class: 'chip', 'aria-pressed': String(active === id),
        onclick: () => { active = id; items.forEach((b) => { b.hidden = id !== 'all' && b.dataset.cat !== id; }); paint(); }
      }, label)));
    };
    paint();

    lb.dlg = $('#lightbox');
    $('#lbClose').addEventListener('click', () => lb.dlg.close());
    $('#lbPrev').addEventListener('click', () => stepLightbox(-1));
    $('#lbNext').addEventListener('click', () => stepLightbox(1));
    lb.dlg.addEventListener('click', (e) => { if (e.target === lb.dlg) lb.dlg.close(); });
    lb.dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); stepLightbox(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); stepLightbox(1); }
    });
    lb.dlg.addEventListener('close', () => { document.body.classList.remove('is-locked'); if (lb.trigger) lb.trigger.focus({ preventScroll: true }); });
  }

  function openLightbox(btn) {
    lb.list = $$('.gallery__item').filter((b) => !b.hidden);
    lb.index = lb.list.indexOf(btn);
    lb.trigger = btn;
    paintLightbox();
    if (typeof lb.dlg.showModal === 'function') lb.dlg.showModal(); else lb.dlg.setAttribute('open', '');
    document.body.classList.add('is-locked');
    $('#lbClose').focus();
  }

  function stepLightbox(d) {
    lb.index = (lb.index + d + lb.list.length) % lb.list.length;
    lb.trigger = lb.list[lb.index];
    paintLightbox();
  }

  function paintLightbox() {
    const g = GALLERY[Number(lb.list[lb.index].dataset.i)];
    const meta = ASSETS[g.name] || { w: 1, h: 1 };
    const img = $('#lbImg');
    img.src = `assets/images/${g.name}.webp`;
    img.width = meta.w; img.height = meta.h;
    img.alt = g.alt;
    $('#lbCap').textContent = `${g.caption} · ${lb.index + 1} of ${lb.list.length}`;
    const single = lb.list.length < 2;
    $('#lbPrev').hidden = single; $('#lbNext').hidden = single;
  }

  /* 9 — Hero & kitchen video ---------------------------------------------- */
  function initVideos() {
    const hero = $('#heroVideo');
    if (!hero) return;
    const heroSection = $('#home');
    const heroBtn = $('#heroToggle');
    const paintHero = () => {
      const playing = !hero.paused;
      heroBtn.setAttribute('aria-label', playing ? 'Pause background video' : 'Play background video');
      heroBtn.firstElementChild.className = 'bi ' + (playing ? 'bi-pause-fill' : 'bi-play-fill');
    };
    $('source', hero).addEventListener('error', () => { heroSection.classList.add('video-failed'); heroBtn.hidden = true; });
    hero.addEventListener('error', () => { heroSection.classList.add('video-failed'); heroBtn.hidden = true; });
    hero.addEventListener('play', paintHero);
    hero.addEventListener('pause', paintHero);
    let userPaused = reducedMotion;
    heroBtn.addEventListener('click', () => {
      if (hero.paused) { userPaused = false; hero.play().catch(() => {}); } else { userPaused = true; hero.pause(); }
    });
    if (reducedMotion) { hero.removeAttribute('autoplay'); hero.pause(); } else { hero.play().catch(paintHero); }
    paintHero();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        if (userPaused) return;
        if (e.isIntersecting) hero.play().catch(() => {}); else hero.pause();
      }, { threshold: 0.05 }).observe(heroSection);
    }
  }

  /* 9b — Premium layer: preloader, scroll progress, story ------------------ */
  function initPreloader() {
    const root = document.documentElement;
    const pre = $('#preloader');
    if (!pre || !root.classList.contains('js-preload')) return;
    const ring = $('#preloaderRing'), count = $('#preloaderCount');
    const MIN = 1700, MAX = 5000, C = 352, t0 = performance.now();
    let ready = false, leaving = false;
    const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => window.addEventListener('load', r, { once: true }));
    Promise.all([loaded, document.fonts ? document.fonts.ready : null]).then(() => { ready = true; });
    setTimeout(() => { ready = true; }, MAX);
    const leave = () => {
      leaving = true;
      pre.classList.add('is-leaving');
      root.classList.remove('is-loading');
      setTimeout(() => { root.classList.remove('js-preload'); pre.remove(); }, 1400);
    };
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / MIN);
      const p = Math.min(1 - Math.pow(1 - t, 3), ready ? 1 : 0.92);
      ring.style.strokeDashoffset = String(C * (1 - p));
      count.textContent = String(Math.round(p * 100));
      if (p >= 1 && !leaving) setTimeout(leave, 250); else if (!leaving) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function initScrollProgress() {
    const bar = $('#scrollProgress');
    if (!bar) return;
    let queued = false;
    const paint = () => {
      queued = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(paint); } }, { passive: true });
    window.addEventListener('resize', paint);
    paint();
  }

  /** "A day at the table": the sticky stage cross-fades as each step scrolls past. */
  function initStory() {
    const stage = $('#storyStage');
    if (!stage) return;
    const steps = $$('.story__step');
    const layers = $$('.story__layer', stage);
    const now = $('#storyNow');
    const kv = $('#kitchenVideo');
    const kBtn = $('#kitchenToggle');
    const kIndex = layers.indexOf(kv);
    let active = -1, kUserPaused = false, queued = false;

    const paintK = () => {
      const playing = !kv.paused;
      kBtn.setAttribute('aria-label', playing ? 'Pause kitchen video' : 'Play kitchen video');
      kBtn.firstElementChild.className = 'bi ' + (playing ? 'bi-pause-fill' : 'bi-play-fill');
    };
    const syncKitchen = () => {
      const onK = active === kIndex;
      kBtn.hidden = !onK;
      if (onK && !kUserPaused && !reducedMotion) kv.play().catch(() => {}); else kv.pause();
    };
    kv.addEventListener('play', paintK);
    kv.addEventListener('pause', paintK);
    $('source', kv).addEventListener('error', () => { kBtn.hidden = true; });
    kBtn.addEventListener('click', () => {
      if (kv.paused) { kUserPaused = false; kv.play().catch(() => {}); } else { kUserPaused = true; kv.pause(); }
    });

    const set = (i) => {
      if (i === active) return;
      active = i;
      steps.forEach((s, j) => s.classList.toggle('is-active', j === i));
      layers.forEach((l, j) => l.classList.toggle('is-active', j === i));
      now.textContent = String(i + 1).padStart(2, '0');
      syncKitchen();
    };
    const compute = () => {
      queued = false;
      const mobile = window.innerWidth < 992;
      const sb = stage.getBoundingClientRect().bottom;
      const ref = mobile ? sb + (window.innerHeight - sb) * 0.2 : window.innerHeight * 0.5;
      let idx = 0;
      steps.forEach((s, j) => { if (s.getBoundingClientRect().top <= ref) idx = j; });
      set(idx);
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(compute); } };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    compute();
  }

  /* 10 — Navigation & contact --------------------------------------------- */
  function initNav() {
    const collapseEl = $('#mainNav');
    // On mobile the open menu pushes the page down; closing it mid-scroll made the
    // browser overshoot. Close first, then jump to the section once the layout settles.
    $$('.site-header .nav-link').forEach((a) => a.addEventListener('click', (e) => {
      const target = a.getAttribute('href') && a.getAttribute('href').startsWith('#') ? document.querySelector(a.getAttribute('href')) : null;
      if (!collapseEl.classList.contains('show') || !target) return;
      e.preventDefault();
      collapseEl.addEventListener('hidden.bs.collapse', () => {
        target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
        history.replaceState(null, '', a.getAttribute('href'));
      }, { once: true });
      bootstrap.Collapse.getOrCreateInstance(collapseEl).hide();
    }));
    $$('[data-explore]').forEach((b) => b.addEventListener('click', () => {
      setCategory(b.dataset.cat || 'all', { resetQuery: true });
      scrollToMenu();
    }));
    $$('button[data-scroll-menu]').forEach((b) => b.addEventListener('click', () => {
      const drawer = $('#cartDrawer');
      drawer.addEventListener('hidden.bs.offcanvas', scrollToMenu, { once: true });
    }));
    $$('a[data-scroll-menu]').forEach((a) => a.addEventListener('click', () => setTimeout(() => { const t = $('#menuTitle'); t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }, 50)));

    const links = $$('.site-header .nav-link');
    const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          links.forEach((a) => {
            const on = a.getAttribute('href') === '#' + e.target.id;
            a.classList.toggle('active', on);
            if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      sections.forEach((s) => io.observe(s));
    }

    $('#clearFilters').addEventListener('click', () => { state.category = 'all'; state.query = ''; $('#menuSearch').value = ''; renderCategoryChips(); renderMenu(); });
    $('#menuSearch').addEventListener('input', debounce((e) => { state.query = e.target.value; renderMenu(); }, 120));
  }

  /** Direct-contact actions only render when real details are set in menu-data.js. */
  function renderContactConfig() {
    const c = CONFIG.contact;
    const list = $('#contactList');
    const row = (icon, label, value, href) => h('li', null, h('a', { href }, h('i', { class: 'bi ' + icon, 'aria-hidden': 'true' }), label, h('span', { text: value })));
    let any = false;
    if (c.phone) { list.prepend(row('bi-telephone', 'Call', c.phone, 'tel:' + c.phone.replace(/[^\d+]/g, ''))); any = true; }
    if (c.whatsapp) { list.prepend(row('bi-whatsapp', 'WhatsApp', '+' + c.whatsapp, 'https://wa.me/' + c.whatsapp.replace(/\D/g, ''))); any = true; }
    if (c.email) { list.prepend(row('bi-envelope', 'Email', c.email, 'mailto:' + c.email)); any = true; }
    if (any) $('#contactPending').hidden = true;
    if (c.address) {
      $('#locationText').textContent = c.address;
      $('#mapSlot').replaceChildren(c.mapUrl ? h('a', { class: 'btn btn-accent', href: c.mapUrl, target: '_blank', rel: 'noopener noreferrer', text: 'Open in maps' }) : document.createTextNode('Map placeholder. A real map is embedded here once the verified address is supplied.'));
    }
  }

  /* 11 — Reveal on scroll -------------------------------------------------- */
  function initReveal() {
    if (reducedMotion || !('IntersectionObserver' in window)) return;
    const targets = $$('.section-head, .concept, .form-card, .location-card, .tower__figure, .video-card, .event-photos');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    targets.forEach((t) => { t.classList.add('reveal'); io.observe(t); });
  }

  /* 12 — Boot -------------------------------------------------------------- */
  function init() {
    initPreloader();
    initNav();
    initCart();
    initForms();
    initGallery();
    initVideos();
    initStory();
    initScrollProgress();
    renderContactConfig();
    setCategory('all');
    renderCart();
    showView('cart', { focus: false });
    initReveal();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
