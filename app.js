// ====== Demo producten ======
const PRODUCTS = [
  { id: "p1", name: "Brood", price: 2.15, category: "Bakker" },
  { id: "p2", name: "Melk 1L", price: 1.29, category: "Zuivel" },
  { id: "p3", name: "Eieren (10)", price: 2.99, category: "Zuivel" },
  { id: "p4", name: "Appels (1kg)", price: 2.49, category: "Fruit" },
  { id: "p5", name: "Bananen (1kg)", price: 1.99, category: "Fruit" },
  { id: "p6", name: "Koffie", price: 5.49, category: "Dranken" },
  { id: "p7", name: "Thee", price: 2.79, category: "Dranken" },
  { id: "p8", name: "Pasta", price: 1.59, category: "Kruidenier" },
  { id: "p9", name: "Tomatensaus", price: 1.19, category: "Kruidenier" },
];

const VAT_RATE = 0.21;
const STORAGE_KEY = "kassa_cart_v1";

// cart = { [productId]: quantity }
let cart = loadCart();

// ====== Helpers ======
const euro = (value) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value);

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}
function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}

function cartItems() {
  return Object.entries(cart)
    .map(([id, qty]) => ({ product: getProduct(id), qty: Number(qty) }))
    .filter((x) => x.product && x.qty > 0);
}

function calcTotals() {
  const subtotal = cartItems().reduce((sum, x) => sum + x.product.price * x.qty, 0);
  const vat = subtotal * VAT_RATE;
  const grandTotal = subtotal + vat;
  return { subtotal, vat, grandTotal };
}

// ====== Rendering ======
const productGrid = document.getElementById("productGrid");
const cartList = document.getElementById("cartList");
const cartEmpty = document.getElementById("cartEmpty");

const subtotalEl = document.getElementById("subtotal");
const vatEl = document.getElementById("vat");
const grandTotalEl = document.getElementById("grandTotal");

const searchInput = document.getElementById("searchInput");
const clearCartBtn = document.getElementById("clearCartBtn");
const checkoutBtn = document.getElementById("checkoutBtn");
const checkoutHint = document.getElementById("checkoutHint");

function renderProducts(filterText = "") {
  const q = filterText.trim().toLowerCase();
  const list = PRODUCTS.filter((p) => {
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      euro(p.price).toLowerCase().includes(q)
    );
  });

  productGrid.innerHTML = list
    .map((p) => {
      const inCartQty = cart[p.id] ? Number(cart[p.id]) : 0;
      return `
        <article class="product">
          <div class="top">
            <div>
              <h3>${escapeHtml(p.name)}</h3>
              <div class="price">${euro(p.price)}</div>
            </div>
            <span class="badge">${escapeHtml(p.category)}</span>
          </div>
          <div class="actions">
            <button class="btn btn-primary" data-add="${p.id}" type="button">
              + Toevoegen
            </button>
            <span class="badge" title="Aantal in winkelwagen">
              In wagen: ${inCartQty}
            </span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCart() {
  const items = cartItems();

  if (items.length === 0) {
    cartEmpty.hidden = false;
    cartList.hidden = true;
    cartList.innerHTML = "";
  } else {
    cartEmpty.hidden = true;
    cartList.hidden = false;

    cartList.innerHTML = items
      .map(({ product, qty }) => {
        const lineTotal = product.price * qty;
        return `
          <div class="cart-item">
            <div>
              <h4>${escapeHtml(product.name)}</h4>
              <div class="cart-meta">
                ${escapeHtml(product.category)} • ${euro(product.price)} / stuk • Lijn: <strong>${euro(lineTotal)}</strong>
              </div>
            </div>

            <div class="qty">
              <button class="icon-btn" data-dec="${product.id}" type="button" aria-label="Minder">−</button>
              <input
                data-qty="${product.id}"
                type="number"
                min="1"
                step="1"
                value="${qty}"
                inputmode="numeric"
                aria-label="Aantal"
              />
              <button class="icon-btn" data-inc="${product.id}" type="button" aria-label="Meer">+</button>
              <button class="icon-btn btn-danger" data-remove="${product.id}" type="button" aria-label="Verwijderen">🗑</button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  const { subtotal, vat, grandTotal } = calcTotals();
  subtotalEl.textContent = euro(subtotal);
  vatEl.textContent = euro(vat);
  grandTotalEl.textContent = euro(grandTotal);

  checkoutHint.textContent =
    items.length === 0
      ? ""
      : `Items: ${items.reduce((n, x) => n + x.qty, 0)} • Uniek: ${items.length}`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[m];
  });
}

// ====== Actions ======
function addToCart(productId, amount = 1) {
  const current = cart[productId] ? Number(cart[productId]) : 0;
  cart[productId] = current + amount;
  saveCart();
  rerender();
}

function setQty(productId, qty) {
  const n = Number(qty);
  if (!Number.isFinite(n) || n < 1) return;
  cart[productId] = Math.floor(n);
  saveCart();
  rerender();
}

function inc(productId) {
  addToCart(productId, 1);
}
function dec(productId) {
  const current = cart[productId] ? Number(cart[productId]) : 0;
  const next = current - 1;
  if (next <= 0) {
    delete cart[productId];
  } else {
    cart[productId] = next;
  }
  saveCart();
  rerender();
}
function remove(productId) {
  delete cart[productId];
  saveCart();
  rerender();
}
function clearCart() {
  cart = {};
  saveCart();
  rerender();
}

function rerender() {
  renderProducts(searchInput.value);
  renderCart();
}

// ====== Events ======
productGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-add]");
  if (!btn) return;
  addToCart(btn.dataset.add, 1);
});

cartList.addEventListener("click", (e) => {
  const incBtn = e.target.closest("button[data-inc]");
  const decBtn = e.target.closest("button[data-dec]");
  const removeBtn = e.target.closest("button[data-remove]");

  if (incBtn) return inc(incBtn.dataset.inc);
  if (decBtn) return dec(decBtn.dataset.dec);
  if (removeBtn) return remove(removeBtn.dataset.remove);
});

cartList.addEventListener("change", (e) => {
  const input = e.target.closest("input[data-qty]");
  if (!input) return;
  setQty(input.dataset.qty, input.value);
});

searchInput.addEventListener("input", () => {
  renderProducts(searchInput.value);
});

clearCartBtn.addEventListener("click", clearCart);

checkoutBtn.addEventListener("click", () => {
  const items = cartItems();
  if (items.length === 0) {
    checkoutHint.textContent = "Voeg eerst items toe.";
    return;
  }

  const { subtotal, vat, grandTotal } = calcTotals();

  // Demo "bonnetje" in een simpele alert:
  const lines = [
    "=== BON ===",
    ...items.map((x) => `${x.qty}× ${x.product.name} — ${euro(x.product.price * x.qty)}`),
    "------------",
    `Subtotaal: ${euro(subtotal)}`,
    `BTW (21%): ${euro(vat)}`,
    `Totaal:    ${euro(grandTotal)}`,
  ];

  alert(lines.join("\n"));

  // Als je wilt: na afrekenen leegmaken
  clearCart();
});

// Init
rerender();
