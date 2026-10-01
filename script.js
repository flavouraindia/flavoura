/* ==========================================================================
   FLAVOURA — script.js
   Cart · catalogue · modals · checkout validation · Discord "Spice Bot"
   webhook · WhatsApp handoff · Instagram-style story viewer · FAQ
   Pure vanilla JS, no build step.
   ========================================================================== */
(() => {
  'use strict';

  /* ------------------------------------------------------------------------
     1. CONFIG — edit values here, nowhere else
     ------------------------------------------------------------------------ */
  const CONFIG = {
    whatsappNumber: '919088055818',          // country code + number, no "+"
    // Spice Bot webhook (Flavoura channel). Kept exactly as in the original site.
    discordWebhookUrl:
      'https://discord.com/api/webhooks/1548727130454761502/uQbUb9BvtlTtMTnQ_p2pIy8NpEg0-giznGYbSz53Ux3ASdwYvndbcUNYli1yaNMSc_fh',
    discordColor: 12068138,                  // Flavoura brand red (#B8252A)
    currency: '₹',
    maxQtyPerItem: 99,
    storageKey: 'flavoura.cart.v1',
    viewedKey: 'flavoura.stories.viewed.v1',
    storyDurationMs: { image: 6000, card: 7000 }
  };

  /* ------------------------------------------------------------------------
     2. DATA — products
     Swap `img` for a local file (e.g. 'assets/products/achaari.webp') whenever
     you have final product shots. `zoom` / `focus` tune the crop per image.
     ------------------------------------------------------------------------ */
  const HEAT = {
    mild:   { level: 1, label: 'Mild' },
    medium: { level: 2, label: 'Medium' },
    bold:   { level: 3, label: 'Bold' }
  };

  const PRODUCTS = [
    {
      id: 'achaari',
      name: 'Achaari Premix',
      title: 'Achaari Premix',
      category: 'gravy',
      price: 120,
      size: '80g',
      heat: 'medium',
      img: 'https://lh3.googleusercontent.com/d/1aji77tplyuewCGq5Utjl1_o500Up-AcC',
      desc: 'Tangy, zesty pickle flavor base with saunf, zeera, mustard & kalaunji.',
      method: [{ text: '400g tomato puree + 500g protein + 80g premix (entire bottle). Sauté & cook in oil.' }],
      ingredients:
        'This premix contains methi daana, saunf, zeera, mustard, kalaunji, Kashmiri red chilli, coriander seeds, citric acid, onion, ginger, and garlic powders, black salt, garam masala, and haldi.'
    },
    {
      id: 'haryali',
      name: 'Haryali Premix',
      title: 'Haryali Premix',
      category: 'marinade',
      price: 120,
      size: '60g',
      heat: 'medium',
      img: 'https://lh3.googleusercontent.com/d/1rmVdIN9BQxlbXgLN6IM0OX1A5E46PK6q',
      desc: 'Fresh green marinade with green chilli, kaju, and fried onion.',
      method: [{ text: '500g protein + 60g premix (full bottle). Add oil/butter, pan fry & cook.' }],
      ingredients:
        'This premix contains dalchini, cardamom (black and green), clove, black pepper, star anise, kaju powder, onion and milk powders, zeera, coriander, ginger, garam masala, garlic flakes, green chilli, fried onion, salt and food colour.'
    },
    {
      id: 'angaara',
      name: 'Angaara Premix',
      title: 'Angaara Premix',
      category: 'marinade',
      price: 120,
      size: '80g',
      heat: 'bold',
      img: 'https://lh3.googleusercontent.com/d/15Y9dkWPW9dJcm2KsXGib4fZtB5gP5LRV',
      desc: 'Rich restaurant-style marinade with cashews, almonds, and spices.',
      method: [{ text: '500g protein + 80g premix (full bottle) + 200g thick curd. Cook till tender.' }],
      ingredients:
        'This premix contains cashew, almond, dalchini, green cardamom, Kashmiri lal mirch, clove, black pepper, star anise, ginger, milk, and garlic powders, cornflour, Kashmiri red chilli, coriander, cumin, and garam masala powders, salt, kasuri methi, and fried onion.'
    },
    {
      id: 'fishfry',
      name: 'Fish Fry Premix',
      title: 'Fish Fry Premix',
      category: 'marinade',
      price: 120,
      size: '60g',
      heat: 'medium',
      img: 'https://lh3.googleusercontent.com/d/1b9cMhLQoNv9bkncIHA3JQF4mGJ4MLRpD',
      desc: 'Crispy marinade with ajwain, rai, cumin, and Kashmiri chilli.',
      method: [{ text: '500g fish slices + 20g premix (1/3 bottle) + 1 tbsp lemon juice. Shallow pan-fry.' }],
      ingredients:
        'This premix contains coriander powder, Kashmiri red chilli, garlic and ginger powders, cumin powder, turmeric, chaat masala, garam masala, rai, and ajwain.'
    },
    {
      id: 'tandoori',
      name: 'Tandoori Premix',
      title: 'Tandoori Premix',
      category: 'marinade',
      price: 120,
      size: '60g',
      heat: 'bold',
      img: 'https://lh3.googleusercontent.com/d/1SDIxz_5Td3mHqZLl5Pi-LBLUPtnjJ1wW',
      desc: 'Classic tandoori marinade with aamchur, jayphal, and Kashmiri chilli.',
      method: [{ text: '500g chicken/paneer + 30g premix (1/2 bottle) + 200g curd + lemon juice. Cook in pan.' }],
      ingredients:
        'This premix contains Kashmiri chilli powder, zeera powder, chaat masala, aamchur powder, salt, ginger powder, garlic powder, garam masala and jayphal powder.'
    },
    {
      id: 'whitegravy',
      name: 'White Gravy Premix',
      title: 'White Gravy',
      category: 'gravy',
      price: 120,
      size: '60g',
      heat: 'mild',
      img: 'https://lh3.googleusercontent.com/d/1ZnNnrIqWTiJEBpkotLc4nMMLosV-teOf',
      desc: 'Rich Mughlai gravy with cashew, melon seeds, and white sesame.',
      method: [
        { label: 'Paneer:', text: 'Mix 60g premix + milk paste. Cook in butter/oil until thick, add 500g paneer.' },
        { label: 'Chicken:', text: 'Marinate 500g chicken with 60g premix + 200g curd. Cook in butter/oil.' }
      ],
      ingredients:
        'This premix contains cashew, melon seeds, white sesame, milk powder, chaat masala, salt, cornflour, onion powder, garlic powder, ginger powder, sugar, garam masala, and kasuri methi.'
    },
    {
      id: 'redgravy',
      name: 'Red Gravy Premix',
      title: 'Red Gravy',
      category: 'gravy',
      price: 120,
      size: '80g',
      heat: 'medium',
      img: 'https://lh3.googleusercontent.com/d/1RNYkqEYmSXWtiaEQcJKiOdq6MwFpMqle',
      desc: 'Classic North Indian gravy base with cashews, milk powder, and red chilli.',
      method: [
        { label: 'Veg/Paneer:', text: 'Cook 400g tomato puree in oil. Add 80g premix water-paste + 500g paneer/veg.' },
        { label: 'Chicken:', text: 'Marinate 500g chicken with 80g premix + curd/water. Add to cooked tomato puree.' }
      ],
      ingredients:
        'This premix contains cashew, white sesame, melon seeds, milk powder, chaat masala, onion powder, garlic powder, ginger powder, red chilli powder, garam masala, cornflour, salt, sugar, kasuri methi, ghee, and red food color.'
    },
    {
      id: 'goldengravy',
      name: 'Golden Gravy Premix',
      title: 'Golden Gravy',
      category: 'gravy',
      price: 120,
      size: '80g',
      heat: 'medium',
      img: 'https://lh3.googleusercontent.com/d/1AtIqdvmWTJBsqtHeWW-3201oYfc_F89g',
      desc: 'Rich cashew & sesame base. Great for Shahi Paneer, veggies or chicken.',
      method: [{ text: '400g tomato puree + 80g premix (entire bottle) + 500g protein/veg. Cook in oil until thick.' }],
      ingredients:
        'This premix contains cashew, melon seeds, white sesame, milk powder, chaat masala, salt, onion powder, garlic powder, ginger powder, haldi, red chilli powder, coriander powder, garam masala, kasuri methi, and sugar.'
    }
  ];

  const BY_ID = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

  /* ------------------------------------------------------------------------
     3. DATA — Instagram-style story highlights
     Slide types:
       image → { type:'image', src, alt }
       card  → { type:'card', theme, title, html, cta? }
     ------------------------------------------------------------------------ */
  const pad = n => String(n).padStart(2, '0');

  const reviewSlides = Array.from({ length: 11 }, (_, i) => ({
    type: 'image',
    src: `assets/stories/reviews/review-${pad(i + 1)}.webp`,
    alt: `Customer review ${i + 1} of 11`
  }));

  const faqSlides = Array.from({ length: 7 }, (_, i) => ({
    type: 'image',
    src: `assets/stories/faq/faq-${pad(i + 1)}.webp`,
    alt: `Flavoura FAQ ${i + 1} of 7`
  }));

  const ICONS = {
    spice: `<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="M40 14c10 3 12 14 4 26-7 10-19 17-31 16-4-.3-5-4-2-6 9-4 16-9 20-17 2-4 2-8 5-13 1-3 2-5 4-6z"/><path fill="currentColor" d="M38 13c0-4 3-7 8-8-1 3-2 5-4 7z"/></svg>`,
    about: `<span class="icon-letter" aria-hidden="true">F</span>`
  };

  const STORIES = [
    {
      id: 'recipes',
      label: 'Quick Recipes',
      icon: 'assets/highlights/recipes.png',
      slides: [
        {
          type: 'card', theme: 'cream', title: '3 things. 30 minutes.',
          html: `<ol class="story-steps">
                   <li><strong>Main</strong><span>Chicken, paneer, fish or veggies</span></li>
                   <li><strong>Flavoura premix</strong><span>Your favourite flavour pack</span></li>
                   <li><strong>Masala base</strong><span>Curd or tomato puree</span></li>
                 </ol>
                 <p class="story-note">No chopping onions. No peeling garlic. Just combine and cook.</p>`
        },
        {
          type: 'card', theme: 'maroon', title: 'Gravy or dry? Your call.',
          html: `<p>Add curd or tomato puree for a thick, restaurant-style gravy.</p>
                 <p>Want a tikka-style starter instead? Marinate with less liquid and pan-fry.</p>`
        },
        {
          type: 'card', theme: 'cream', title: 'Watch the recipes',
          html: `<p>Every premix has a step-by-step video on our YouTube playlist.</p>`,
          cta: { label: 'Open YouTube playlist', href: 'https://youtube.com/playlist?list=PLcIbgv4CULTTXqynXPDaPgVsT-ob_uLhc', external: true }
        }
      ]
    },
    { id: 'reviews', label: 'Customer Reviews', icon: 'assets/highlights/reviews.png', slides: reviewSlides },
    {
      id: 'spice',
      label: 'Spice Levels',
      iconHtml: ICONS.spice,
      slides: [
        {
          type: 'card', theme: 'maroon', title: 'Bold & spicy',
          html: `<p class="story-meter" aria-label="Three out of three chillies"><i class="on"></i><i class="on"></i><i class="on"></i></p>
                 <p>Our boldest blends.</p>
                 <ul class="story-list"><li>Angaara Premix</li><li>Tandoori Premix</li></ul>`
        },
        {
          type: 'card', theme: 'cream', title: 'Medium heat',
          html: `<p class="story-meter" aria-label="Two out of three chillies"><i class="on"></i><i class="on"></i><i></i></p>
                 <p>Balanced, everyday heat.</p>
                 <ul class="story-list"><li>Achaari Premix</li><li>Haryali Premix</li><li>Fish Fry Premix</li><li>Red Gravy</li><li>Golden Gravy</li></ul>`
        },
        {
          type: 'card', theme: 'cream', title: 'Mild & creamy',
          html: `<p class="story-meter" aria-label="One out of three chillies"><i class="on"></i><i></i><i></i></p>
                 <p>Prefer a mild, creamy taste? Go for the White Gravy Premix.</p>`,
          cta: { label: 'See all premixes', scroll: '#catalogue' }
        }
      ]
    },
    { id: 'faqs', label: 'FAQs', icon: 'assets/highlights/faqs.png', slides: faqSlides },
    {
      id: 'ordering',
      label: 'How to Order',
      icon: 'assets/highlights/ordering.png',
      slides: [
        {
          type: 'card', theme: 'cream', title: 'Pick your premixes',
          html: `<p>Flat ₹120 per pack. No minimum order — even one bottle is fine.</p>`
        },
        {
          type: 'card', theme: 'maroon', title: 'Share your details',
          html: `<p>Add your name, a 10-digit mobile number and your delivery address. We receive your order and open WhatsApp with it pre-filled.</p>`
        },
        {
          type: 'card', theme: 'cream', title: 'We call to confirm',
          html: `<p>We confirm the exact delivery charge (Uber Parcel / courier) and share UPI payment details. Pan-India shipping available.</p>`,
          cta: { label: 'Start your order', scroll: '#catalogue' }
        }
      ]
    },
    {
      id: 'products',
      label: 'Products',
      icon: 'assets/highlights/products.png',
      slides: [
        { type: 'image', src: 'assets/stories/product/angaara.webp', alt: 'Angaara Premix, 80g pack' },
        {
          type: 'card', theme: 'maroon', title: 'Eight premixes, one price',
          html: `<p>Gravies and marinades, ₹120 a pack.</p>`,
          cta: { label: 'Browse the range', scroll: '#catalogue' }
        }
      ]
    },
    {
      id: 'about',
      label: 'About Us',
      iconHtml: ICONS.about,
      slides: [
        {
          type: 'card', theme: 'cream', title: 'Swaad jo maa ki yaad dilae',
          html: `<p>Flavoura premixes bring home-cooked, restaurant-style flavour to busy kitchens — hostels, offices and families.</p>`
        },
        {
          type: 'card', theme: 'maroon', title: 'What goes in',
          html: `<ul class="story-list"><li>Real nuts & whole spices</li><li>Onion, ginger & garlic already blended in</li><li>Salt pre-portioned in every pack</li><li>No preservatives</li><li>100% vegetarian premix</li></ul>`
        },
        {
          type: 'card', theme: 'cream', title: 'Made to be trusted',
          html: `<p>FSSAI registered<br><strong>22824038000288</strong></p><p>Best stored in a cool, dry place. Lasts up to 6 months.</p>`
        }
      ]
    }
  ];

  /* ------------------------------------------------------------------------
     4. SMALL HELPERS
     ------------------------------------------------------------------------ */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const money = n => `${CONFIG.currency}${n}`;
  const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  const esc = s =>
    String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const store = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* private mode */ } }
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let toastTimer;
  function toast(message) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2200);
  }

  /* ------------------------------------------------------------------------
     5. CART
     ------------------------------------------------------------------------ */
  const cart = new Map(); // productId -> qty
  let orderPlaced = false;

  function loadCart() {
    const saved = store.get(CONFIG.storageKey);
    if (!saved || typeof saved !== 'object') return;
    Object.entries(saved).forEach(([id, qty]) => {
      if (BY_ID[id] && Number.isInteger(qty) && qty > 0) cart.set(id, Math.min(qty, CONFIG.maxQtyPerItem));
    });
  }

  function persistCart() {
    store.set(CONFIG.storageKey, Object.fromEntries(cart));
  }

  function totals() {
    const lines = [];
    let qty = 0;
    let amount = 0;
    cart.forEach((q, id) => {
      const product = BY_ID[id];
      const lineAmount = q * product.price;
      lines.push({ product, qty: q, amount: lineAmount });
      qty += q;
      amount += lineAmount;
    });
    return { lines, qty, amount };
  }

  function changeQty(id, delta) {
    if (!BY_ID[id]) return;
    const next = Math.max(0, Math.min(CONFIG.maxQtyPerItem, (cart.get(id) || 0) + delta));
    if (next === 0) cart.delete(id); else cart.set(id, next);
    persistCart();
    renderBuyAction(id, delta > 0);
    renderCartChrome();
    if (delta > 0 && next === 1) toast(`${BY_ID[id].name} added to cart`);
  }

  function clearCart() {
    const ids = Array.from(cart.keys());
    cart.clear();
    persistCart();
    ids.forEach(id => renderBuyAction(id));
    renderCartChrome();
  }

  function renderBuyAction(id, bump = false) {
    const host = $(`[data-action-for="${id}"]`);
    if (!host) return;
    const qty = cart.get(id) || 0;
    const name = esc(BY_ID[id].name);
    host.innerHTML = qty > 0
      ? `<div class="qty-control${bump ? ' is-bump' : ''}">
           <button type="button" class="qty-btn" data-dec="${id}" aria-label="Remove one ${name}">−</button>
           <span class="qty-value" aria-live="polite">${qty}</span>
           <button type="button" class="qty-btn" data-inc="${id}" aria-label="Add one ${name}">+</button>
         </div>`
      : `<button type="button" class="btn-add" data-add="${id}">Add to cart</button>`;
  }

  function renderCartChrome() {
    const { qty, amount } = totals();
    const bar = $('#cartBar');
    const badge = $('#headerCartCount');
    $('#cartBarItems').textContent = `${qty} item${qty === 1 ? '' : 's'} added`;
    $('#cartBarTotal').textContent = `Item total: ${money(amount)}`;
    bar.classList.toggle('is-active', qty > 0);
    bar.setAttribute('aria-hidden', qty > 0 ? 'false' : 'true');
    document.body.classList.toggle('has-cart', qty > 0);
    if (badge) {
      badge.textContent = qty;
      badge.hidden = qty === 0;
    }
  }

  /* ------------------------------------------------------------------------
     6. CATALOGUE RENDER + FILTER
     ------------------------------------------------------------------------ */
  function productCard(p) {
    const heat = HEAT[p.heat];
    const dots = [1, 2, 3].map(n => `<i class="${n <= heat.level ? 'on' : ''}"></i>`).join('');
    const method = p.method
      .map(m => `<li>${m.label ? `<strong>${esc(m.label)}</strong> ` : ''}${esc(m.text)}</li>`)
      .join('');
    return `
      <article class="product-card" data-category="${p.category}" data-id="${p.id}">
        <div class="product-media" data-title="${esc(p.title)}">
          <img src="${esc(p.img)}" alt="${esc(p.title)} instant premix pack" loading="lazy" decoding="async" referrerpolicy="no-referrer">
          <span class="heat-badge"><span class="heat-dots" aria-hidden="true">${dots}</span>${heat.label}</span>
        </div>
        <div class="product-body">
          <div>
            <h3 class="product-title">${esc(p.title)}</h3>
            <p class="product-desc">${esc(p.desc)}</p>
            <div class="method">
              <p class="method-title">How to cook (500g)</p>
              <ul>${method}</ul>
            </div>
          </div>
          <div class="product-buy">
            <p class="price"><strong>${money(p.price)}</strong><span>${esc(p.size)} pack</span></p>
            <button type="button" class="btn-ingredients" data-ingredients="${p.id}">Check ingredients</button>
            <div class="buy-action" data-action-for="${p.id}"></div>
          </div>
        </div>
      </article>`;
  }

  function renderCatalogue() {
    const grid = $('#productGrid');
    grid.innerHTML = PRODUCTS.map(productCard).join('');
    PRODUCTS.forEach(p => renderBuyAction(p.id));
    // Graceful fallback if a hosted image fails to load
    $$('.product-media img', grid).forEach(img => {
      img.addEventListener('error', () => img.closest('.product-media').classList.add('is-fallback'));
    });
  }

  function applyFilter(filter) {
    $$('[data-filter]').forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.filter === filter)));
    $$('.product-card').forEach(card => {
      card.hidden = !(filter === 'all' || card.dataset.category === filter);
    });
  }

  /* ------------------------------------------------------------------------
     7. MODALS (ingredients + checkout) with focus handling
     ------------------------------------------------------------------------ */
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let activeLayer = null;   // modal or story viewer currently on top
  let lastFocused = null;

  function openLayer(el, focusSel) {
    lastFocused = document.activeElement;
    activeLayer = el;
    const t = $('#toast');
    if (t) t.classList.remove('is-visible');
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('layer-open');
    const target = (focusSel && $(focusSel, el)) || $(FOCUSABLE, el);
    if (target) setTimeout(() => target.focus({ preventScroll: true }), 30);
  }

  function closeLayer(el = activeLayer) {
    if (!el) return;
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
    if (activeLayer === el) activeLayer = null;
    if (!activeLayer) document.body.classList.remove('layer-open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus({ preventScroll: true });
    if (el.id === 'checkoutModal' && orderPlaced) {
      orderPlaced = false;
      clearCart();
      showCheckoutForm();
      $('#checkoutForm').reset();
    }
  }

  function trapTab(e) {
    if (e.key !== 'Tab' || !activeLayer) return;
    const items = $$(FOCUSABLE, activeLayer).filter(n => n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function openIngredients(id) {
    const p = BY_ID[id];
    if (!p) return;
    $('#ingredientsTitle').textContent = p.name;
    $('#ingredientsText').textContent = p.ingredients;
    openLayer($('#ingredientsModal'), '.modal-ok');
  }

  /* ------------------------------------------------------------------------
     8. CHECKOUT — summary, strict validation, Discord webhook, WhatsApp
     ------------------------------------------------------------------------ */
  const PHONE_PATTERN = /^[6-9]\d{9}$/;
  let lastWhatsappUrl = '';
  let submitting = false;

  function showCheckoutForm() {
    $('#checkoutFormView').hidden = false;
    $('#checkoutSuccessView').hidden = true;
    clearErrors();
  }

  function renderCheckoutSummary() {
    const { lines, qty, amount } = totals();
    const rows = lines
      .map(l => `<div class="cart-row"><span>${esc(l.product.name)} × ${l.qty}</span><span>${money(l.amount)}</span></div>`)
      .join('');
    $('#cartBreakdown').innerHTML =
      rows +
      `<div class="cart-row cart-total"><span>Items total (${qty} pack${qty === 1 ? '' : 's'})</span><span>${money(amount)}</span></div>`;
  }

  function openCheckout() {
    if (cart.size === 0) {
      toast('Your cart is empty. Add a premix to get started.');
      $('#catalogue').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      return;
    }
    showCheckoutForm();
    renderCheckoutSummary();
    openLayer($('#checkoutModal'), '#custName');
  }

  const FIELD_RULES = {
    custName: {
      error: 'errName',
      test: v => v.length >= 2,
      message: 'Enter your full name.'
    },
    custPhone: {
      error: 'errPhone',
      test: v => PHONE_PATTERN.test(v),
      message: 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.'
    },
    custAddress: {
      error: 'errAddress',
      test: v => v.length >= 10,
      message: 'Enter your complete address with house/flat, street and pincode.'
    }
  };

  function setFieldError(inputId, message) {
    const rule = FIELD_RULES[inputId];
    const input = $('#' + inputId);
    const err = $('#' + rule.error);
    err.textContent = message || '';
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    input.closest('.field').classList.toggle('has-error', Boolean(message));
  }

  function clearErrors() {
    Object.keys(FIELD_RULES).forEach(id => setFieldError(id, ''));
  }

  function validateForm() {
    let firstInvalid = null;
    Object.entries(FIELD_RULES).forEach(([id, rule]) => {
      const value = $('#' + id).value.trim();
      const ok = rule.test(value);
      setFieldError(id, ok ? '' : rule.message);
      if (!ok && !firstInvalid) firstInvalid = $('#' + id);
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  function buildOrder() {
    const name = $('#custName').value.trim();
    const phone = $('#custPhone').value.trim();
    const address = $('#custAddress').value.trim();
    const { lines, qty, amount } = totals();
    let itemsSummary = '';
    lines.forEach(l => { itemsSummary += `• ${l.product.name} x ${l.qty} = ${money(l.amount)}\n`; });
    return { name, fullPhone: `+91 ${phone}`, address, itemsSummary, totalQty: qty, subtotal: amount };
  }

  function sendToDiscord(o) {
    // Same "Spice Bot" payload structure as the original site.
    const payload = {
      username: 'Spice Bot',
      embeds: [{
        title: '🛒 NEW FLAVOURA ORDER REQUEST',
        color: CONFIG.discordColor,
        fields: [
          { name: 'Customer Name', value: clip(o.name, 1024), inline: true },
          { name: 'Phone Number', value: o.fullPhone, inline: true },
          { name: 'Delivery Address', value: clip(o.address, 1024) },
          { name: 'Items Ordered', value: clip(o.itemsSummary || 'None', 1024) },
          { name: 'Total Packs', value: `${o.totalQty} packs`, inline: true },
          { name: 'Subtotal', value: money(o.subtotal), inline: true }
        ],
        timestamp: new Date().toISOString()
      }]
    };
    // keepalive lets the request finish even while WhatsApp takes over the tab
    return fetch(CONFIG.discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(err => console.error('Spice Bot Discord Webhook Error:', err));
  }

  function buildWhatsappUrl(o) {
    const message =
      `*NEW FLAVOURA ORDER REQUEST*\n\n` +
      `*Customer Name:* ${o.name}\n` +
      `*Phone:* ${o.fullPhone}\n` +
      `*Delivery Address:* ${o.address}\n\n` +
      `*ITEMS ORDERED:*\n${o.itemsSummary}\n` +
      `*Item Subtotal (${o.totalQty} packs):* ${money(o.subtotal)}\n\n` +
      `Please call me back to confirm order & total delivery charge.`;
    return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }

  function openWhatsapp(url) {
    const w = window.open(url, '_blank');
    if (!w) window.location.href = url; // popup blocked → same-tab fallback
  }

  function submitOrder(e) {
    e.preventDefault();
    if (submitting || !validateForm()) return;
    submitting = true;
    const btn = $('#submitOrder');
    btn.disabled = true;

    const order = buildOrder();
    sendToDiscord(order);                 // fire and forget (keepalive)
    lastWhatsappUrl = buildWhatsappUrl(order);
    openWhatsapp(lastWhatsappUrl);        // opened in the same tick as the click

    orderPlaced = true;
    $('#successName').textContent = order.name.split(/\s+/)[0];
    $('#checkoutFormView').hidden = true;
    $('#checkoutSuccessView').hidden = false;
    submitting = false;
    btn.disabled = false;
    $('#reopenWhatsapp').focus();
  }

  /* ------------------------------------------------------------------------
     9. STORY HIGHLIGHTS — rail + full-screen viewer
     ------------------------------------------------------------------------ */
  const viewedStories = new Set(store.get(CONFIG.viewedKey) || []);

  function renderHighlights() {
    $('#highlightRail').innerHTML = STORIES.map(s => {
      const icon = s.iconHtml
        ? `<span class="highlight-icon highlight-icon--svg">${s.iconHtml}</span>`
        : `<span class="highlight-icon"><img src="${esc(s.icon)}" alt="" width="64" height="64" loading="eager" decoding="async"></span>`;
      return `<button type="button" class="highlight${viewedStories.has(s.id) ? ' is-viewed' : ''}" data-story="${s.id}" role="listitem" aria-label="Open story: ${esc(s.label)}">
                <span class="highlight-ring">${icon}</span>
                <span class="highlight-label">${esc(s.label)}</span>
              </button>`;
    }).join('');
  }

  function renderReviewGallery() {
    const host = $('#reviewGallery');
    if (!host) return;
    host.innerHTML = reviewSlides.map((s, i) =>
      `<button type="button" class="review-thumb" data-story="reviews" data-start="${i}" aria-label="Open customer review ${i + 1} of ${reviewSlides.length}">
         <img src="${esc(s.src)}" alt="" loading="lazy" decoding="async">
       </button>`).join('');
  }

  const viewer = {
    root: null, stage: null, bars: null, title: null,
    story: null, index: 0, userPaused: false, holdPaused: false, holdTimer: null, holding: false
  };

  function buildViewer() {
    const root = $('#storyViewer');
    viewer.root = root;
    viewer.stage = $('.story-stage', root);
    viewer.bars = $('.story-bars', root);
    viewer.title = $('.story-title', root);
  }

  function isPaused() { return viewer.userPaused || viewer.holdPaused; }

  function syncPause() {
    viewer.root.classList.toggle('is-paused', isPaused());
    const btn = $('[data-story-pause]', viewer.root);
    btn.setAttribute('aria-pressed', String(viewer.userPaused));
    btn.setAttribute('aria-label', viewer.userPaused ? 'Play story' : 'Pause story');
  }

  function openStory(id, start = 0) {
    const story = STORIES.find(s => s.id === id);
    if (!story) return;
    viewer.story = story;
    viewer.index = Math.max(0, Math.min(start, story.slides.length - 1));
    viewer.userPaused = reducedMotion.matches; // don't autoplay for reduced-motion users
    viewer.holdPaused = false;
    viewer.title.textContent = story.label;
    viewer.bars.innerHTML = story.slides.map(() => '<span class="story-bar"><i></i></span>').join('');
    viewedStories.add(id);
    store.set(CONFIG.viewedKey, Array.from(viewedStories));
    $$(`.highlight[data-story="${id}"]`).forEach(n => n.classList.add('is-viewed'));
    renderSlide();
    openLayer(viewer.root, '[data-story-close]');
  }

  function renderSlide() {
    const { story, index } = viewer;
    const slide = story.slides[index];
    const duration = CONFIG.storyDurationMs[slide.type] || 6000;

    viewer.stage.dataset.type = slide.type;
    viewer.stage.dataset.theme = slide.theme || '';
    if (slide.type === 'image') {
      viewer.stage.querySelector('.story-content').innerHTML =
        `<img class="story-image" src="${esc(slide.src)}" alt="${esc(slide.alt || '')}" draggable="false">`;
    } else {
      const cta = slide.cta
        ? (slide.cta.href
            ? `<a class="btn btn-gold story-cta" href="${esc(slide.cta.href)}" target="_blank" rel="noopener">${esc(slide.cta.label)}</a>`
            : `<button type="button" class="btn btn-gold story-cta" data-story-scroll="${esc(slide.cta.scroll)}">${esc(slide.cta.label)}</button>`)
        : '';
      viewer.stage.querySelector('.story-content').innerHTML =
        `<div class="story-card"><h3>${esc(slide.title)}</h3><div class="story-body">${slide.html}</div>${cta}</div>`;
    }

    // progress bars
    $$('.story-bar', viewer.bars).forEach((bar, i) => {
      bar.classList.toggle('is-done', i < index);
      bar.classList.remove('is-active');
      const fill = $('i', bar);
      fill.style.animation = 'none';
      fill.onanimationend = null;
      if (i === index) {
        void bar.offsetWidth; // restart animation
        bar.classList.add('is-active');
        fill.style.animation = '';
        fill.style.setProperty('--story-dur', `${duration}ms`);
        fill.onanimationend = nextSlide;
      }
    });
    syncPause();

    // warm the next image
    const upcoming = story.slides[index + 1];
    if (upcoming && upcoming.type === 'image') { const im = new Image(); im.src = upcoming.src; }
  }

  function nextSlide() {
    if (!viewer.story) return;
    if (viewer.index < viewer.story.slides.length - 1) { viewer.index += 1; renderSlide(); }
    else closeStory();
  }

  function prevSlide() {
    if (viewer.index > 0) viewer.index -= 1;
    renderSlide();
  }

  function closeStory() {
    viewer.story = null;
    closeLayer(viewer.root);
  }

  function bindViewer() {
    const stage = viewer.stage;

    const endHold = () => {
      clearTimeout(viewer.holdTimer);
      if (viewer.holding) { viewer.holding = false; viewer.holdPaused = false; syncPause(); }
    };

    stage.addEventListener('pointerdown', e => {
      if (e.target.closest('a, button')) return;
      viewer.holdTimer = setTimeout(() => { viewer.holding = true; viewer.holdPaused = true; syncPause(); }, 220);
    });
    stage.addEventListener('pointerup', e => {
      clearTimeout(viewer.holdTimer);
      if (e.target.closest('a, button')) return;
      if (viewer.holding) { endHold(); return; }
      const r = stage.getBoundingClientRect();
      (e.clientX - r.left) < r.width * 0.3 ? prevSlide() : nextSlide();
    });
    stage.addEventListener('pointercancel', endHold);
    stage.addEventListener('pointerleave', endHold);

    // swipe down to close on touch devices
    let touchStart = null;
    stage.addEventListener('touchstart', e => { touchStart = e.touches[0]; }, { passive: true });
    stage.addEventListener('touchend', e => {
      if (!touchStart) return;
      const t = e.changedTouches[0];
      if (t.clientY - touchStart.clientY > 110 && Math.abs(t.clientX - touchStart.clientX) < 70) closeStory();
      touchStart = null;
    }, { passive: true });

    $('[data-story-pause]', viewer.root).addEventListener('click', () => {
      viewer.userPaused = !viewer.userPaused;
      syncPause();
    });
    $('[data-story-prev]', viewer.root).addEventListener('click', prevSlide);
    $('[data-story-next]', viewer.root).addEventListener('click', nextSlide);
    $$('[data-story-close]', viewer.root).forEach(b => b.addEventListener('click', closeStory));
    viewer.root.addEventListener('click', e => { if (e.target === viewer.root) closeStory(); });
  }

  /* ------------------------------------------------------------------------
     10. EVENT WIRING
     ------------------------------------------------------------------------ */
  function onDocumentClick(e) {
    const t = e.target.closest('[data-add],[data-inc],[data-dec],[data-ingredients],[data-open-checkout],[data-close-layer],[data-filter],[data-story],[data-story-scroll],[data-faq],[data-reopen-whatsapp],[data-finish-order]');
    if (!t) {
      // click on a modal backdrop closes it
      const layer = e.target.classList && e.target.classList.contains('modal') ? e.target : null;
      if (layer) closeLayer(layer);
      return;
    }
    const d = t.dataset;
    if (d.add)        changeQty(d.add, 1);
    else if (d.inc)   changeQty(d.inc, 1);
    else if (d.dec)   changeQty(d.dec, -1);
    else if (d.ingredients) openIngredients(d.ingredients);
    else if ('openCheckout' in d) openCheckout();
    else if ('closeLayer' in d) closeLayer(t.closest('.modal'));
    else if (d.filter) applyFilter(d.filter);
    else if (d.story) openStory(d.story, Number(d.start) || 0);
    else if (d.storyScroll) {
      closeStory();
      const target = $(d.storyScroll);
      if (target) setTimeout(() => target.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' }), 60);
    }
    else if (d.faq !== undefined) toggleFaq(t);
    else if ('reopenWhatsapp' in d) openWhatsapp(lastWhatsappUrl);
    else if ('finishOrder' in d) closeLayer($('#checkoutModal'));
  }

  function toggleFaq(btn) {
    const item = btn.closest('.faq-item');
    const willOpen = btn.getAttribute('aria-expanded') !== 'true';
    $$('.faq-item').forEach(i => {
      i.classList.remove('is-open');
      $('.faq-q', i).setAttribute('aria-expanded', 'false');
    });
    if (willOpen) {
      item.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    }
  }

  function onKeydown(e) {
    if (e.key === 'Tab') return trapTab(e);
    if (!activeLayer) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      activeLayer === viewer.root ? closeStory() : closeLayer(activeLayer);
    } else if (activeLayer === viewer.root) {
      if (e.key === 'ArrowRight') nextSlide();
      else if (e.key === 'ArrowLeft') prevSlide();
    }
  }

  function bindForm() {
    const form = $('#checkoutForm');
    form.addEventListener('submit', submitOrder);
    const phone = $('#custPhone');
    phone.addEventListener('input', () => { phone.value = phone.value.replace(/\D/g, '').slice(0, 10); });
    Object.keys(FIELD_RULES).forEach(id => {
      $('#' + id).addEventListener('blur', () => {
        const v = $('#' + id).value.trim();
        if (v) setFieldError(id, FIELD_RULES[id].test(v) ? '' : FIELD_RULES[id].message);
      });
      $('#' + id).addEventListener('input', () => {
        if ($('#' + id).getAttribute('aria-invalid') === 'true' && FIELD_RULES[id].test($('#' + id).value.trim())) setFieldError(id, '');
      });
    });
  }

  /* ------------------------------------------------------------------------
     11. INIT
     ------------------------------------------------------------------------ */
  function init() {
    loadCart();
    renderHighlights();
    renderCatalogue();
    renderReviewGallery();
    renderCartChrome();
    applyFilter('all');
    buildViewer();
    bindViewer();
    bindForm();

    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onKeydown);

    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    // Re-sync if the cart was changed in another tab
    window.addEventListener('storage', e => {
      if (e.key !== CONFIG.storageKey) return;
      cart.clear();
      loadCart();
      PRODUCTS.forEach(p => renderBuyAction(p.id));
      renderCartChrome();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
