// ============================================================
//  CONFIG — slug นี้คือ org slug จริงในฐานข้อมูล Sales-Account (ห้ามแก้ตามชื่อแบรนด์)
// ============================================================
const API_BASE = 'https://sales-account-git-main-scale-up-s-projects2.vercel.app';
const STORE_SLUG = 'sabai-panich'; // org slug ใน Sales-Account — แบรนด์หน้าร้านคือ Geargao แต่ slug ฐานข้อมูลยังเป็นชื่อเดิม

// ============================================================
//  STATE
// ============================================================
let allProducts = [];       // in-stock products (มีรูป + stock > 0)
let preOrderProducts = [];  // pre-order (ไม่แสดงถ้าไม่มีรูป)
let storeInfo = null;
let activeTab = 'instock';
let activeCat = 'ทั้งหมด';
let activeSort = 'default';
let activeStockFilter = 'all';
let cart = loadCart();
let selectedPayment = 'transfer';
let currentModal = null;
let currentModalQty = 1;

// Pages
const PAGE_SIZE = 24;
let currentPage = 1;

// ============================================================
//  FETCH PRODUCTS
// ============================================================
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/public/products?slug=${STORE_SLUG}`);
    if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลได้');
    const data = await res.json();

    storeInfo = data.store;
    updateStoreUI();

    // รับเฉพาะข้อมูลสินค้าที่อยู่ในรูปแบบที่หน้าเว็บรองรับ
    allProducts = normalizeProducts(data.products).filter(hasProductImage);
    preOrderProducts = normalizeProducts(data.preOrderProducts).filter(hasProductImage);

    // Update stats
    document.getElementById('statTotal').textContent = allProducts.length + preOrderProducts.length;
    document.getElementById('statInstock').textContent = allProducts.length;
    document.getElementById('statPreorder').textContent = preOrderProducts.length;

    buildCategoryUI();
    applyFilters();
  } catch(e) {
    document.getElementById('productGrid').innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <div class="empty-icon">⚠️</div>
        <p style="color:#E53935;font-weight:700">ไม่สามารถโหลดสินค้าได้</p>
        <p style="margin-top:8px">${esc(e.message || 'เกิดข้อผิดพลาด')}</p>
        <button class="btn-primary" onclick="loadProducts()" style="margin-top:16px">🔄 ลองใหม่</button>
      </div>`;
    document.getElementById('resultCount').textContent = 'โหลดไม่สำเร็จ';
  }
}

function updateStoreUI() {
  if (!storeInfo) return;
  const ph = storeInfo.phone || '';
  document.getElementById('storePhone').textContent = ph ? `📞 ${ph}` : 'ติดต่อร้านค้า';
  document.getElementById('footerPhone').textContent = ph ? `📞 ${ph}` : '📞 —';
  if (storeInfo.address) {
    document.getElementById('storeAddress').textContent = storeInfo.address;
  }
}
function normalizeProducts(products) {
  if (!Array.isArray(products)) return [];
  return products.filter(p => p && typeof p.id === "string" && p.id.length <= 100).map(p => ({
    id: p.id,
    code: typeof p.code === "string" ? p.code : "",
    name: typeof p.name === "string" ? p.name : "สินค้า",
    description: typeof p.description === "string" ? p.description : "",
    categoryName: typeof p.categoryName === "string" ? p.categoryName : "",
    unitName: typeof p.unitName === "string" ? p.unitName : "",
    salePrice: Math.max(0, Number(p.salePrice) || 0),
    availableQty: Number(p.availableQty) || 0,
    image1Url: validImg(p.image1Url),
    image2Url: validImg(p.image2Url),
    image3Url: validImg(p.image3Url),
    image4Url: validImg(p.image4Url),
  }));
}

function hasProductImage(p) {
  return [p.image1Url, p.image2Url, p.image3Url, p.image4Url].some(Boolean);
}


// ============================================================
//  CATEGORY UI
// ============================================================
function buildCategoryUI() {
  const src = activeTab === 'instock' ? allProducts : preOrderProducts;
  const cats = ['ทั้งหมด', ...new Set(src.map(p => p.categoryName || 'ไม่ระบุหมวด'))];
  const catCounts = {};
  cats.forEach(c => {
    catCounts[c] = c === 'ทั้งหมด' ? src.length : src.filter(p => (p.categoryName||'ไม่ระบุหมวด') === c).length;
  });

  // Chips
  const chipsEl = document.getElementById('catChips');
  chipsEl.innerHTML = cats.map(c =>
    `<button class="cat-chip${activeCat===c?' active':''}" onclick="filterCat('${c}')">${c}</button>`
  ).join('');

  // Sidebar
  const sideEl = document.getElementById('sidebarCats');
  sideEl.innerHTML = cats.map(c =>
    `<div class="sidebar-item${activeCat===c?' active':''}" onclick="filterCat('${c}')">
      <span>${c}</span><span class="count">${catCounts[c]}</span>
    </div>`
  ).join('');
}

// ============================================================
//  FILTER & SORT
// ============================================================
function getSource() {
  return activeTab === 'instock' ? allProducts : preOrderProducts;
}

function getFilteredList() {
  let src = [...getSource()];
  const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  const minP = parseFloat(document.getElementById('priceMin')?.value) || 0;
  const maxP = parseFloat(document.getElementById('priceMax')?.value) || Infinity;

  if (q) {
    src = src.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.categoryName||'').toLowerCase().includes(q)
    );
  }
  if (activeCat !== 'ทั้งหมด') {
    src = src.filter(p => (p.categoryName||'ไม่ระบุหมวด') === activeCat);
  }
  if (minP > 0 || maxP < Infinity) {
    src = src.filter(p => p.salePrice >= minP && p.salePrice <= maxP);
  }
  if (activeStockFilter === 'high') src = src.filter(p => p.availableQty > 10);
  if (activeStockFilter === 'low') src = src.filter(p => p.availableQty >= 1 && p.availableQty <= 10);

  // Sort
  if (activeSort === 'price-asc') src.sort((a,b) => a.salePrice - b.salePrice);
  else if (activeSort === 'price-desc') src.sort((a,b) => b.salePrice - a.salePrice);
  else if (activeSort === 'name') src.sort((a,b) => a.name.localeCompare(b.name, 'th'));
  else if (activeSort === 'stock-desc') src.sort((a,b) => b.availableQty - a.availableQty);

  return src;
}

function applyFilters() {
  currentPage = 1;
  renderProducts(getFilteredList());
}

function filterCat(cat) {
  activeCat = cat;
  document.querySelectorAll('.cat-chip').forEach(el => el.classList.toggle('active', el.textContent === cat));
  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.toggle('active', el.querySelector('span')?.textContent === cat));
  applyFilters();
}

function setTab(tab) {
  activeTab = tab;
  activeCat = 'ทั้งหมด';
  document.getElementById('tab-instock').classList.toggle('active', tab==='instock');
  document.getElementById('tab-preorder').classList.toggle('active', tab==='preorder');
  document.getElementById('nav-instock').classList.toggle('active', tab==='instock');
  document.getElementById('nav-preorder').classList.toggle('active', tab==='preorder');
  buildCategoryUI();
  applyFilters();
  document.getElementById('productSection').scrollIntoView({behavior:'smooth'});
}

function sortProducts(val) {
  activeSort = val;
  applyFilters();
}

function filterStock(val) {
  activeStockFilter = val;
  document.querySelectorAll('[id^="stock-"]').forEach(el => el.style.fontWeight = '400');
  document.getElementById('stock-' + val) && (document.getElementById('stock-' + val).style.fontWeight = '700');
  applyFilters();
}

function doHeaderSearch() {
  const q = document.getElementById('headerSearch').value;
  document.getElementById('searchInput').value = q;
  closeHeaderSearchResults();
  document.getElementById('productSection').scrollIntoView({behavior:'smooth'});
  applyFilters();
}


function closeHeaderSearchResults() {
  const results = document.getElementById('headerSearchResults');
  results.classList.remove('open');
  results.innerHTML = '';
}

function renderHeaderSearchResults() {
  const input = document.getElementById('headerSearch');
  const results = document.getElementById('headerSearchResults');
  const query = input.value.trim().toLowerCase();
  if (!query) { closeHeaderSearchResults(); return; }
  const matches = [...allProducts, ...preOrderProducts].filter(p =>
    p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query) ||
    (p.categoryName || '').toLowerCase().includes(query)
  ).slice(0, 6);
  if (!matches.length) {
    results.innerHTML = '<div class="header-search-label">No matching products</div>';
    results.classList.add('open');
    return;
  }
  results.innerHTML = '<div class="header-search-label">Found ' + matches.length + (matches.length === 6 ? '+' : '') + ' products</div>' +
    matches.map(p => {
      const image = validImg(p.image1Url) || validImg(p.image2Url) || validImg(p.image3Url) || validImg(p.image4Url);
      return '<button class="header-search-item" data-header-product-id="' + esc(p.id) + '" role="option">' +
        (image ? '<img src="' + esc(image) + '" alt=""/>' : '<span class="header-search-thumb">&#128717;</span>') +
        '<span><span class="header-search-name">' + esc(p.name) + '</span><span class="header-search-meta">' + esc(p.categoryName || p.code || 'Geargao') + '</span></span>' +
        '<span class="header-search-price">&#3647;' + p.salePrice.toLocaleString('th-TH') + '</span></button>';
    }).join('') + '<button class="header-search-all" data-header-show-all>View all results</button>';
  results.classList.add('open');
}

// ============================================================
//  RENDER PRODUCTS
// ============================================================
function renderProducts(list) {
  const grid = document.getElementById('productGrid');
  const total = list.length;
  document.getElementById('resultCount').textContent = `แสดง ${total} รายการ`;

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const page = Math.min(currentPage, totalPages || 1);
  const paged = list.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  if (!paged.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1">
      <div class="empty-icon">${activeTab==='preorder'?'📋':'📦'}</div>
      <p>ไม่พบสินค้าที่ตรงกับเงื่อนไข</p>
    </div>`;
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  grid.innerHTML = paged.map(p => productCardHTML(p)).join('');

  // Pagination
  if (totalPages > 1) {
    let pages = '';
    for (let i=1;i<=totalPages;i++) {
      pages += `<button onclick="goPage(${i})" style="width:36px;height:36px;border-radius:8px;border:1.5px solid ${i===page?'var(--blue)':'var(--gray-border)'};background:${i===page?'var(--blue)':'white'};color:${i===page?'white':'var(--gray-dark)'};font-weight:700;font-size:13px;cursor:pointer">${i}</button>`;
    }
    document.getElementById('pagination').innerHTML = pages;
  } else {
    document.getElementById('pagination').innerHTML = '';
  }
}

function goPage(p) {
  currentPage = p;
  renderProducts(getFilteredList());
  document.getElementById('productSection').scrollIntoView({behavior:'smooth'});
}

function productCardHTML(p) {
  const img = validImg(p.image1Url) || validImg(p.image2Url) || validImg(p.image3Url) || validImg(p.image4Url);
  const isPreOrder = activeTab === 'preorder';
  const isCritical = p.availableQty <= 3 && !isPreOrder;
  const badge = isPreOrder
    ? `<span class="product-badge badge-preorder">🕐 Pre-order</span>`
    : isCritical
      ? `<span class="product-badge badge-low">⚡ เหลือน้อย!</span>`
      : `<span class="product-badge badge-instock">✅ พร้อมส่ง</span>`;

  return `
  <div class="product-card" data-product-id="${esc(p.id)}">
    <div class="product-img-wrap">
      ${img
        ? `<img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy" onerror="this.parentNode.innerHTML='<div class=\\'product-img-placeholder\\'>🛍️</div>'">`
        : `<div class="product-img-placeholder">🛍️</div>`}
      ${badge}
      <button class="wish-btn" data-wishlist title="บันทึก">♡</button>
    </div>
    <div class="product-info">
      ${p.categoryName ? `<div class="product-brand">${esc(p.categoryName)}</div>` : ''}
      <div class="product-name">${esc(p.name)}</div>
      <div class="product-code">${esc(p.code)}</div>
      <div class="product-price">
        <span class="baht">฿</span>${p.salePrice.toLocaleString('th-TH')}
      </div>
      ${p.unitName ? `<div class="product-unit">/ ${esc(p.unitName)}</div>` : ''}
    </div>
    <div class="product-actions">
      <button class="btn-cart" data-add-to-cart>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
        ใส่ตะกร้า
      </button>
      <button class="btn-buy" data-buy-now>
        ซื้อเลย
      </button>
    </div>
  </div>`;
}

function validImg(u) {
  if (typeof u !== "string" || u.length > 2000) return null;
  try {
    const url = new URL(u);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function esc(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ============================================================
document.getElementById("productGrid").addEventListener("click", event => {
  const target = event.target.closest("[data-product-id], [data-add-to-cart], [data-buy-now], [data-wishlist]");
  if (!target) return;
  const card = target.closest("[data-product-id]");
  const product = [...allProducts, ...preOrderProducts].find(p => p.id === card?.dataset.productId);
  if (!product) return;
  if (target.matches("[data-wishlist]")) target.classList.toggle("active");
  else if (target.matches("[data-add-to-cart]")) addToCart(product, 1);
  else if (target.matches("[data-buy-now]")) buyNow(product);
  else openProduct(product.id);
});

//  PRODUCT MODAL — Gallery with thumbnails + arrows
// ============================================================
let modalImages = [];
let modalImgIndex = 0;

function openProduct(id) {
  const src = [...allProducts, ...preOrderProducts];
  const p = src.find(x => x.id === id);
  if (!p) return;
  currentModal = p;
  currentModalQty = 1;
  modalImgIndex = 0;

  // รวมรูปทุกรูปที่มี
  modalImages = [p.image1Url, p.image2Url, p.image3Url, p.image4Url].filter(u => validImg(u));

  const isPreOrder = preOrderProducts.some(x => x.id === id);
  const stockColor = isPreOrder ? '#E65100' : p.availableQty > 10 ? 'var(--green)' : '#FB8C00';
  const stockText = isPreOrder
    ? 'Pre-order — รับสินค้า 3-5 วันทำการ'
    : p.availableQty > 1
      ? `มีสินค้า ${p.availableQty} ชิ้น`
      : 'สินค้าหมด / Pre-order';

  // ---- Image section ----
  renderModalGallery();

  // ---- Info section ----
  document.getElementById('modalInfoSection').innerHTML = `
    <button class="modal-close-btn" onclick="closeProduct()">✕</button>
    ${p.categoryName ? `<div class="modal-cat">${esc(p.categoryName)}</div>` : ''}
    <div class="modal-name">${esc(p.name)}</div>
    <div class="modal-code">รหัส: ${esc(p.code)}</div>
    <div class="modal-price-box">
      <div class="modal-price"><span class="baht-sym">฿</span>${p.salePrice.toLocaleString('th-TH')}</div>
      ${p.unitName ? `<div class="modal-unit">ราคาต่อ 1 ${esc(p.unitName)}</div>` : ''}
    </div>
    <div class="stock-info">
      <div class="stock-dot" style="background:${stockColor}"></div>
      <span style="font-weight:700;color:${stockColor}">${stockText}</span>
    </div>
    ${p.description ? `<div class="modal-desc">${esc(p.description.split('#')[0].trim())}</div>` : ''}
    <div class="qty-row">
      <label>จำนวน</label>
      <div class="qty-control">
        <button onclick="changeModalQty(-1)">−</button>
        <input type="number" id="modalQty" value="1" min="1" onchange="currentModalQty=parseInt(this.value)||1"/>
        <button onclick="changeModalQty(1)">+</button>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-modal-cart" onclick="addToCartModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/></svg>
        ใส่ตะกร้า
      </button>
      <button class="btn-modal-buy" onclick="buyNowModal()">
        ซื้อเลย →
      </button>
    </div>
  `;

  document.getElementById('productModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function renderModalGallery() {
  const sec = document.getElementById('modalImgSection');
  const hasImgs = modalImages.length > 0;
  const currentImg = hasImgs ? modalImages[modalImgIndex] : null;

  sec.innerHTML = `
    <!-- Main image -->
    <div class="modal-main-img" id="modalMainImg">
      ${currentImg
        ? `<img id="modalMainImgEl" src="${currentImg}" alt="สินค้า"/>`
        : `<div class="modal-img-placeholder">🛍️</div>`}
      ${modalImages.length > 1 ? `
        <button class="img-arrow prev" onclick="event.stopPropagation();shiftModalImg(-1)">‹</button>
        <button class="img-arrow next" onclick="event.stopPropagation();shiftModalImg(1)">›</button>
      ` : ''}
    </div>
    <!-- Thumbnails -->
    ${modalImages.length > 1 ? `
    <div class="modal-thumbs" id="modalThumbs">
      ${modalImages.map((u, i) => `
        <div class="modal-thumb${i===modalImgIndex?' active':''}" onclick="selectModalImg(${i})">
          <img src="${u}" alt="thumb ${i+1}" loading="lazy"/>
        </div>`).join('')}
    </div>` : ''}
  `;
}

function shiftModalImg(dir) {
  modalImgIndex = (modalImgIndex + dir + modalImages.length) % modalImages.length;
  updateModalMainImg();
}

function selectModalImg(idx) {
  modalImgIndex = idx;
  updateModalMainImg();
}

function updateModalMainImg() {
  // update main img
  const el = document.getElementById('modalMainImgEl');
  if (el) {
    el.style.opacity = '0';
    setTimeout(() => {
      el.src = modalImages[modalImgIndex];
      el.style.opacity = '1';
    }, 120);
    el.style.transition = 'opacity .12s';
  }
  // update thumb active
  document.querySelectorAll('.modal-thumb').forEach((t,i) =>
    t.classList.toggle('active', i === modalImgIndex)
  );
}

function closeProduct() {
  document.getElementById('productModal').classList.remove('open');
  document.body.style.overflow = '';
}

function changeModalQty(d) {
  currentModalQty = Math.max(1, currentModalQty + d);
  const inp = document.getElementById('modalQty');
  if (inp) inp.value = currentModalQty;
}

function addToCartModal() {
  if (!currentModal) return;
  addToCart(currentModal, currentModalQty);
  closeProduct();
}

function buyNowModal() {
  if (!currentModal) return;
  addToCart(currentModal, currentModalQty);
  closeProduct();
  openCheckout();
}

document.getElementById('productModal').addEventListener('click', function(e) {
  if (e.target === this) closeProduct();
});

// ============================================================
//  CART
// ============================================================
function saveCart() {
  localStorage.setItem('sabai_cart', JSON.stringify(cart));
  updateCartBadge();
}

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("sabai_cart") || "[]");
    return Array.isArray(saved) ? saved.filter(item => item && typeof item.id === "string").map(item => ({ ...item, qty: Math.min(999, Math.max(1, Math.floor(Number(item.qty) || 1)))})) : [];
  } catch {
    localStorage.removeItem("sabai_cart");
    return [];
  }
}

function updateCartBadge() {
  const total = cart.reduce((s,i) => s+i.qty, 0);
  document.getElementById('cartBadge').textContent = total;
}

function addToCart(p, qty) {
  qty = Math.min(999, Math.max(1, Math.floor(Number(qty) || 1)));
  const existing = cart.find(i => i.id === p.id);
  if (existing) existing.qty = Math.min(999, existing.qty + qty);
  else cart.push({...p, qty});
  saveCart();
  showToast(`✅ "${p.name.substring(0,20)}..." ใส่ตะกร้าแล้ว`, 'success');
}

function buyNow(p) {
  cart = [{...p, qty:1}];
  saveCart();
  openCheckout();
}

function openCart() {
  renderCart();
  document.getElementById('cartOverlay').classList.add('open');
  document.getElementById('cartPanel').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartOverlay').classList.remove('open');
  document.getElementById('cartPanel').classList.remove('open');
  document.body.style.overflow = '';
}

function renderCart() {
  const body = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  if (!cart.length) {
    body.innerHTML = `<div class="cart-empty"><div class="ic">🛒</div><p>ตะกร้าว่างเปล่า</p></div>`;
    footer.style.display = 'none';
    return;
  }
  const total = cart.reduce((s,i) => s + i.salePrice*i.qty, 0);
  body.innerHTML = cart.map((item,idx) => {
    const img = validImg(item.image1Url) || validImg(item.image2Url) || validImg(item.image3Url) || validImg(item.image4Url);
    return `
    <div class="cart-item">
      ${img
        ? `<img class="cart-item-img" src="${img}" alt="${esc(item.name)}"/>`
        : `<div class="cart-item-img-placeholder">🛍️</div>`}
      <div class="cart-item-info">
        <div class="cart-item-name">${esc(item.name)}</div>
        <div class="cart-item-price">฿${(item.salePrice*item.qty).toLocaleString('th-TH')}</div>
        <div class="cart-qty">
          <button class="qty-btn" onclick="cartQty(${idx},-1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="cartQty(${idx},1)">+</button>
          <span style="font-size:12px;color:var(--gray-text);margin-left:4px">×฿${item.salePrice.toLocaleString('th-TH')}</span>
        </div>
      </div>
      <button class="cart-item-del" onclick="removeCart(${idx})">🗑</button>
    </div>`;
  }).join('');
  document.getElementById('cartSubtotal').textContent = `฿${total.toLocaleString('th-TH')}`;
  document.getElementById('cartTotal').textContent = `฿${total.toLocaleString('th-TH')}`;
  footer.style.display = 'block';
}

function cartQty(idx, d) {
  if (!cart[idx]) return;
  cart[idx].qty = Math.min(999, Math.max(1, cart[idx].qty + d));
  saveCart(); renderCart();
}

function removeCart(idx) {
  cart.splice(idx, 1);
  saveCart(); renderCart();
}

// ============================================================
//  CHECKOUT
// ============================================================
function openCheckout() {
  renderCheckoutSummary();
  document.getElementById('checkoutModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('open');
  document.body.style.overflow = '';
}

function renderCheckoutSummary() {
  const sum = document.getElementById('checkoutSummary');
  if (!cart.length) {
    sum.innerHTML = '<p style="text-align:center;color:var(--gray-text);font-size:13px">ตะกร้าว่างเปล่า — กรุณาเพิ่มสินค้าก่อน</p>';
    return;
  }
  const total = cart.reduce((s,i) => s + i.salePrice*i.qty, 0);
  sum.innerHTML = `
    <h4>รายการสินค้า (${cart.length} รายการ)</h4>
    ${cart.map(i => `
      <div class="order-line">
        <span>${esc(i.name.substring(0,28))}${i.name.length>28?'...':''} × ${i.qty}</span>
        <span>฿${(i.salePrice*i.qty).toLocaleString('th-TH')}</span>
      </div>`).join('')}
    <div class="order-line total">
      <span>ยอดรวมทั้งสิ้น</span>
      <span style="color:var(--red)">฿${total.toLocaleString('th-TH')}</span>
    </div>`;
}

function selectPayment(el, method) {
  document.querySelectorAll('.pay-method').forEach(x => x.classList.remove('selected'));
  el.classList.add('selected');
  selectedPayment = method;
}

const PAYMENT_METHOD_MAP = { transfer:'TRANSFER', qr:'QR', cash:'CASH', cod:'COD' };

async function placeOrder() {
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const note = document.getElementById('custNote').value.trim();
  const website = document.getElementById('custWebsite').value; // honeypot — ต้องว่าง

  if (!name) { showToast('กรุณากรอกชื่อ-นามสกุล','error'); return; }
  if (!phone) { showToast('กรุณากรอกเบอร์โทรศัพท์','error'); return; }
  if (!address) { showToast('กรุณากรอกที่อยู่จัดส่ง','error'); return; }
  if (!cart.length) { showToast('กรุณาเพิ่มสินค้าในตะกร้า','error'); return; }

  const paymentMethod = PAYMENT_METHOD_MAP[selectedPayment] || 'TRANSFER';
  const placeBtn = document.querySelector('.btn-place-order');
  const originalBtnHtml = placeBtn ? placeBtn.innerHTML : '';
  if (placeBtn) { placeBtn.disabled = true; placeBtn.textContent = 'กำลังส่งออเดอร์...'; }

  try {
    const res = await fetch(`${API_BASE}/api/public/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: STORE_SLUG,
        customer: { name, phone, email: email || undefined, address, note: note || undefined },
        paymentMethod,
        items: cart.map(i => ({ productId: i.id, qty: i.qty })),
        website,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'สั่งซื้อไม่สำเร็จ กรุณาลองใหม่');

    document.getElementById('orderNumber').textContent = `หมายเลขออเดอร์: ${data.orderNo}`;

    const qrSection = document.getElementById('qrSection');
    if (paymentMethod === 'TRANSFER' || paymentMethod === 'QR') {
      try {
        const qrRes = await fetch(`${API_BASE}/api/public/orders/qr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: STORE_SLUG, orderNo: data.orderNo }),
        });
        const qrData = await qrRes.json();
        if (qrRes.ok && qrData.qrDataUrl) {
          document.getElementById('qrImage').src = qrData.qrDataUrl;
          document.getElementById('qrAmount').textContent = `ยอดที่ต้องชำระ ฿${data.totalAmount.toLocaleString('th-TH')}`;
          qrSection.style.display = 'block';
        } else {
          qrSection.style.display = 'none';
        }
      } catch (e) {
        qrSection.style.display = 'none';
      }
    } else {
      qrSection.style.display = 'none';
    }

    cart = []; saveCart();
    closeCheckout();
    document.getElementById('successModal').classList.add('open');
  } catch (e) {
    showToast(e.message || 'สั่งซื้อไม่สำเร็จ กรุณาลองใหม่', 'error');
  } finally {
    if (placeBtn) { placeBtn.disabled = false; placeBtn.innerHTML = originalBtnHtml; }
  }
}

function closeSuccess() {
  document.getElementById('successModal').classList.remove('open');
  document.getElementById('qrSection').style.display = 'none';
  document.body.style.overflow = '';
}

// ============================================================
//  ORDER TRACKING
// ============================================================
function openTrackOrder() {
  document.getElementById('trackResult').innerHTML = '';
  document.getElementById('trackModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeTrackOrder() {
  document.getElementById('trackModal').classList.remove('open');
  document.body.style.overflow = '';
}

async function checkOrderStatus() {
  const orderNo = document.getElementById('trackOrderNo').value.trim();
  const phone = document.getElementById('trackPhone').value.trim();
  const resultEl = document.getElementById('trackResult');

  if (!orderNo || !phone) {
    resultEl.innerHTML = '<p style="color:var(--red);font-size:13px;margin-top:8px">กรุณากรอกเลขที่ออเดอร์และเบอร์โทรศัพท์</p>';
    return;
  }
  resultEl.innerHTML = '<p style="font-size:13px;color:var(--gray-text);margin-top:8px">กำลังตรวจสอบ...</p>';

  try {
    const params = new URLSearchParams({ slug: STORE_SLUG, orderNo, phone });
    const res = await fetch(`${API_BASE}/api/public/orders/lookup?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'ไม่พบออเดอร์');

    const statusColor = data.status === 'CANCELLED' ? 'var(--red)' : data.status === 'CONFIRMED' ? 'var(--green)' : '#FB8C00';
    resultEl.innerHTML = `
      <div class="order-summary" style="margin-top:16px">
        <h4>สถานะ: <span style="color:${statusColor}">${esc(data.statusLabel)}</span></h4>
        ${data.items.map(i => `
          <div class="order-line">
            <span>${esc(i.productName)} × ${i.quantity}</span>
            <span>฿${i.amount.toLocaleString('th-TH')}</span>
          </div>`).join('')}
        <div class="order-line total">
          <span>ยอดรวม</span>
          <span>฿${data.totalAmount.toLocaleString('th-TH')}</span>
        </div>
      </div>`;
  } catch (e) {
    resultEl.innerHTML = `<p style="color:var(--red);font-size:13px;margin-top:8px">${esc(e.message)}</p>`;
  }
}

// ============================================================
//  TOAST
// ============================================================
let toastTimer;
function showToast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' '+type : '');
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ============================================================
//  BACK TO TOP
// ============================================================
window.addEventListener('scroll', () => {
  document.getElementById('backTop').classList.toggle('show', window.scrollY > 400);
});

// Search on Enter
document.getElementById('headerSearch').addEventListener('keydown', e => {
  if (e.key === 'Enter') doHeaderSearch();
});
document.getElementById('headerSearch').addEventListener('input', renderHeaderSearchResults);
document.getElementById('headerSearch').addEventListener('focus', renderHeaderSearchResults);
document.getElementById('headerSearchResults').addEventListener('click', event => {
  const productButton = event.target.closest('[data-header-product-id]');
  if (productButton) {
    const product = [...allProducts, ...preOrderProducts].find(p => p.id === productButton.dataset.headerProductId);
    closeHeaderSearchResults();
    if (product) openProduct(product.id);
  } else if (event.target.closest('[data-header-show-all]')) {
    doHeaderSearch();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.search-wrap')) closeHeaderSearchResults();
});
document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') applyFilters();
});

// Escape key close modals
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeProduct(); closeCart(); closeCheckout(); closeSuccess(); closeTrackOrder();
  }
});

// ============================================================
//  INIT
// ============================================================
updateCartBadge();
loadProducts();
// Auto-refresh every 2 minutes
setInterval(loadProducts, 120_000);