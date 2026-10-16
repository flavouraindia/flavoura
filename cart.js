/* ==========================================================================
   FLAVOURA SHARED CART  (cart.js)
   Loaded by index.html AND snacks.html, so prices, offers, checkout, the Discord
   "Spice Bot" webhook and the WhatsApp order message live in ONE place.
   Edit prices here; every page follows. Keep this file in the same folder as
   index.html (it is loaded as /cart.js).
   ========================================================================== */
// CART STATE
const cart = {};
const itemPrice = 120;            // FULL-SIZE bottle price

// TRIAL PACK PRICING + FREEBIE (change only these numbers)
const TRIAL_PRICE      = 70;      // per trial pouch when buying fewer than TRIAL_BULK_MIN
const TRIAL_BULK_PRICE = 60;      // per trial pouch when buying TRIAL_BULK_MIN or more
const TRIAL_BULK_MIN   = 4;
const FREE_EVERY       = 3;       // every 3 full-size bottles = 1 free mystery trial pack
const TRIAL_SUFFIX = ' (Trial Pack)';

// BAKED SNACKS (snacks.html): fixed price per item. Change prices only here.
const SNACK_PRICES = {
  'Peri Peri Baked Cashews (75g)': 130,
  'Peri Peri Baked Cashews (100g)': 170,
  'Mint Baked Cashews (75g)': 130,
  'Mint Baked Cashews (100g)': 170,
  'Peri Peri Makhana': 200,
  'Mint Makhana': 200,
  'Cheesy Herb Makhana': 200
};
// Full-size premix names (used to check a saved cart is valid). Add new premixes here too.
const PREMIX_NAMES = ['Achaari Premix', 'Haryali Premix', 'Angaara Premix', 'Fish Fry Premix', 'Tandoori Premix', 'White Gravy Premix', 'Red Gravy Premix', 'Golden Gravy Premix'];

function isSnackItem(name) { return Object.prototype.hasOwnProperty.call(SNACK_PRICES, name); }

function isTrialItem(name) { return name.endsWith(TRIAL_SUFFIX); }

// Trial packs from any flavours are counted together
function trialCost(n) {
  const unit = n >= TRIAL_BULK_MIN ? TRIAL_BULK_PRICE : TRIAL_PRICE;
  return { unit, total: n * unit };
}

// Everything the cart bar, checkout, Discord and WhatsApp need, in one place
function calcTotals() {
  let fullQty = 0, trialQty = 0, snackQty = 0, snackTotal = 0;
  for (const item in cart) {
    if (isTrialItem(item)) trialQty += cart[item];
    else if (isSnackItem(item)) { snackQty += cart[item]; snackTotal += cart[item] * SNACK_PRICES[item]; }
    else fullQty += cart[item];
  }
  const trial = trialCost(trialQty);
  const fullTotal = fullQty * itemPrice;
  return {
    fullQty, trialQty, snackQty, trial, fullTotal, snackTotal,
    totalQty: fullQty + trialQty + snackQty,
    total: fullTotal + trial.total + snackTotal,
    saved: trialQty * TRIAL_PRICE - trial.total,
    free: Math.floor(fullQty / FREE_EVERY)      // free mystery trial packs (snacks do not count)
  };
}

// Price of ONE unit of any item that is not a trial pack
function unitPrice(item) { return isSnackItem(item) ? SNACK_PRICES[item] : itemPrice; }

// ---------- SHARED CART: the cart is remembered in this browser, so it follows
// the customer between index.html and snacks.html ----------
const CART_STORAGE_KEY = 'flavouraCart.v1';
const CART_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;   // forget an untouched cart after 7 days

function isKnownItem(name) {
  return isSnackItem(name) || PREMIX_NAMES.includes(name) ||
         (isTrialItem(name) && PREMIX_NAMES.includes(name.slice(0, -TRIAL_SUFFIX.length)));
}
function saveCart() {
  try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), items: cart })); } catch (e) {}
}
function loadCartFromStorage() {
  for (const k in cart) delete cart[k];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || typeof data.items !== 'object' || Date.now() - (data.savedAt || 0) > CART_MAX_AGE_MS) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    for (const k in data.items) {
      const q = Math.floor(Number(data.items[k]));
      if (isKnownItem(k) && q > 0 && q <= 99) cart[k] = q;
    }
  } catch (e) {}
}
// Redraw every Add-to-Cart / quantity button on this page, and the bottom bar
function renderEverything() {
  document.querySelectorAll('[id^="action-"]').forEach(el => renderProductCardAction(el.id.slice(7)));
  renderCartBar();
}
function clearCartAfterOrder() {
  for (const k in cart) delete cart[k];
  saveCart();
  renderEverything();
}

// Google Analytics: record an "add_to_cart" event (GA4) every time a pack is added
function trackAddToCart(productName, qty) {
  try {
    if (typeof gtag !== 'function') return;
    const trial = isTrialItem(productName);
    const snack = isSnackItem(productName);
    const price = snack ? SNACK_PRICES[productName] : trial ? TRIAL_PRICE : itemPrice;
    gtag('event', 'add_to_cart', {
      currency: 'INR',
      value: price * qty,
      items: [{
        item_id: productName,
        item_name: productName,
        item_category: snack ? 'Baked snack' : trial ? 'Trial pack' : 'Full-size pack',
        price: price,
        quantity: qty
      }]
    });
  } catch (e) { /* tracking must never block the cart */ }
}

function updateQty(productName, delta) {
  if (!cart[productName]) cart[productName] = 0;
  cart[productName] += delta;
  if (delta > 0) trackAddToCart(productName, delta);

  if (cart[productName] <= 0) {
    delete cart[productName];
  }
  saveCart();

  // Update Product Card Action UI
  renderProductCardAction(productName);
  renderCartBar();
}

function renderProductCardAction(productName) {
  const container = document.getElementById(`action-${productName}`);
  if (!container) return;

  const currentQty = cart[productName] || 0;

  if (currentQty > 0) {
    container.innerHTML = `
      <div class="qty-control">
        <button class="qty-btn" onclick="updateQty('${productName}', -1)">-</button>
        <span class="qty-value">${currentQty}</span>
        <button class="qty-btn" onclick="updateQty('${productName}', 1)">+</button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button class="btn-add-cart" onclick="updateQty('${productName}', 1)">🛒 Add to Cart</button>
    `;
  }
}

function renderCartBar() {
  const t = calcTotals();
  const cartBar = document.getElementById('stickyCartBar');
  if (t.totalQty > 0) {
    cartBar.classList.add('active');
    document.getElementById('stickyTotalItems').innerText = `${t.totalQty} Item${t.totalQty > 1 ? 's' : ''} Added`;
    document.getElementById('stickyTotalPrice').innerText = `Item Total: ₹${t.total}`;

    const extras = [];
    if (t.saved > 0) extras.push(`<div><em>You saved ₹${t.saved} 🎉</em></div>`);
    if (t.free > 0) extras.push(`<div>🎁 + ${t.free} free mystery trial pack${t.free > 1 ? 's' : ''}</div>`);
    // one gentle nudge when the customer is exactly one item away from a perk
    if (t.fullQty % FREE_EVERY === FREE_EVERY - 1) {
      extras.push(`<div>Add 1 more bottle for a free mystery trial pack 🎁</div>`);
    } else if (t.trialQty === TRIAL_BULK_MIN - 1) {
      extras.push(`<div>Add 1 more trial pack and they're ₹${TRIAL_BULK_PRICE} each 🎉</div>`);
    }
    document.getElementById('stickyExtras').innerHTML = extras.join('');
  } else {
    cartBar.classList.remove('active');
  }
}

// Modal Control Functions
function openIngredientsModal(title, text) {
  document.getElementById('modalProductTitle').innerText = title;
  document.getElementById('modalIngredientsList').innerText = text;
  document.getElementById('ingredientsModal').classList.add('active');
}

function openCheckoutModal() {
  const breakdown = document.getElementById('cartItemsBreakdown');
  breakdown.innerHTML = '';
  const t = calcTotals();

  const addRow = (left, right) => {
    const row = document.createElement('div');
    row.className = 'cart-item-row';
    row.innerHTML = `<span>${left}</span><span>${right}</span>`;
    breakdown.appendChild(row);
  };

  // full-size bottles: priced each. trial packs: quantity only (priced together below)
  for (let item in cart) {
    addRow(`${item} x ${cart[item]}`, isTrialItem(item) ? '' : `₹${cart[item] * unitPrice(item)}`);
  }

  if (t.trialQty > 0) {
    addRow(`<strong>Trial Packs x ${t.trialQty} @ ₹${t.trial.unit} each</strong>`, `₹${t.trial.total}`);
  }
  if (t.free > 0) {
    addRow(`🎁 <strong>Free Mystery Trial Pack x ${t.free}</strong>`, '<strong>FREE</strong>');
  }
  if (t.saved > 0) {
    addRow(`<em>You saved 🎉</em>`, `<em>₹${t.saved}</em>`);
  }

  const totalRow = document.createElement('div');
  totalRow.className = 'cart-total-row';
  totalRow.innerHTML = `<span>Items Total (${t.totalQty} packs)</span><span>₹${t.total}</span>`;
  breakdown.appendChild(totalRow);

  document.getElementById('checkoutModal').classList.add('active');
}

function closeModalDirect(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function closeModal(modalId, event) {
  if (event.target === document.getElementById(modalId)) {
    closeModalDirect(modalId);
  }
}

// POLICY MODAL CONTROLLER
function openPolicyModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closePolicyModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
  history.pushState("", document.title, window.location.pathname + window.location.search);
}

function closePolicyModalOnOverlay(modalId, event) {
  if (event.target === document.getElementById(modalId)) {
    closePolicyModal(modalId);
  }
}

// Auto-open modal if someone visits myflavoura.in/#refunds directly
window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash;
  if (hash === '#refunds') openPolicyModal('refunds-modal');
  if (hash === '#privacy') openPolicyModal('privacy-modal');
  if (hash === '#shipping') openPolicyModal('shipping-modal');
});

// SUBMIT ORDER WITH DISCORD WEBHOOK LOGGING + WHATSAPP REDIRECT
async function submitOrder(e) {
  e.preventDefault();

  const name = document.getElementById('custName').value.trim();
  const rawPhone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();

  // Strict JS fallback check for Indian Mobile Number
  const phonePattern = /^[6-9]\d{9}$/;
  if (!phonePattern.test(rawPhone)) {
    alert("Please enter a valid 10-digit Indian mobile number.");
    return;
  }

  const fullPhone = `+91 ${rawPhone}`;

  // 1. Build Item Summary
  const t = calcTotals();
  const totalQty = t.totalQty;
  let itemsSummary = '';
  for (let item in cart) {
    itemsSummary += isTrialItem(item)
      ? `• ${item} x ${cart[item]}\n`
      : `• ${item} x ${cart[item]} = ₹${cart[item] * unitPrice(item)}\n`;
  }
  if (t.trialQty > 0) {
    itemsSummary += `\n*Trial packs:* ${t.trialQty} x ₹${t.trial.unit} = ₹${t.trial.total}\n`;
  }
  if (t.free > 0) {
    itemsSummary += `\n🎁 *FREE Mystery Trial Pack x ${t.free}* (surprise flavour, our pick!)\n`;
  }

  // Order label: trial-only, mixed, or regular
  let orderLabel = 'ORDER REQUEST';
  if (t.trialQty > 0 && t.fullQty === 0 && t.snackQty === 0) orderLabel = 'TRIAL PACK ORDER REQUEST';
  else if (t.snackQty > 0 && t.fullQty === 0 && t.trialQty === 0) orderLabel = 'SNACKS ORDER REQUEST';
  else if (t.trialQty > 0 || t.snackQty > 0) {
    const extra = [t.trialQty > 0 ? 'TRIAL PACKS' : '', t.snackQty > 0 ? 'SNACKS' : ''].filter(Boolean).join(' & ');
    orderLabel = `ORDER REQUEST (INCLUDES ${extra})`;
  }

  // 2. SPICE BOT DISCORD WEBHOOK
  const discordWebhookUrl = "https://discord.com/api/webhooks/1555527432176672829/rPV4GwhKY_s59OCpvBYFiTufRTnoDbGi7y8ADU6P6vvytNcY263in1TwRtyCpTaTgFne";

  const discordPayload = {
    username: "Spice Bot",
    embeds: [{
      title: `🛒 NEW FLAVOURA ${orderLabel}`,
      color: 12068138,
      fields: [
        { name: "Customer Name", value: name, inline: true },
        { name: "Phone Number", value: fullPhone, inline: true },
        { name: "Delivery Address", value: address },
        { name: "Items Ordered", value: itemsSummary || "None" },
        ...(t.free > 0 ? [{ name: "🎁 Free Mystery Trial Pack", value: `${t.free} to add when packing (our choice of flavour, customer does not know)` }] : []),
        { name: "Total Packs", value: `${totalQty} packs${t.free > 0 ? ` (+${t.free} free)` : ''}`, inline: true },
        { name: "Subtotal", value: `₹${t.total}`, inline: true }
      ],
      timestamp: new Date().toISOString()
    }]
  };

  try {
    await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    });
  } catch (err) {
    console.error("Spice Bot Discord Webhook Error:", err);
  }

  // 3. WHATSAPP REDIRECT FOR CUSTOMER
  const message = `*NEW FLAVOURA ${orderLabel}*\n\n` +
                  `*Customer Name:* ${name}\n` +
                  `*Phone:* ${fullPhone}\n` +
                  `*Delivery Address:* ${address}\n\n` +
                  `*ITEMS ORDERED:*\n${itemsSummary}\n` +
                  `*Item Subtotal (${totalQty} packs):* ₹${t.total}\n\n` +
                  `Please call me back to confirm order & total delivery charge.`;

  const whatsappUrl = `https://wa.me/919088055818?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');

  closeModalDirect('checkoutModal');
  clearCartAfterOrder();     // order sent: start the next visit with an empty cart
}

// ---------- START: restore the saved cart on every page ----------
function startCart() { loadCartFromStorage(); renderEverything(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startCart); else startCart();
// back/forward button and other tabs: pick up the latest cart
window.addEventListener('pageshow', e => { if (e.persisted) { loadCartFromStorage(); renderEverything(); } });
window.addEventListener('storage', e => { if (e.key === CART_STORAGE_KEY) { loadCartFromStorage(); renderEverything(); } });
