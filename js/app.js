// ============================================
// ДАННЫЕ
// ============================================
let products = [];
let cart = [];
let selectedSize = null;
let currentProductId = null;

// ============================================
// ХЕЛПЕР: экранирование HTML
// ============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text ?? '');
    return div.innerHTML;
}

// ============================================
// TOAST-УВЕДОМЛЕНИЯ
// ============================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✅', error: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || '✅'}</span>
        <span class="toast-text">${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-show'));
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================
// ЗАГРУЗКА / СОХРАНЕНИЕ
// ============================================
function loadData() {
    const savedProducts = localStorage.getItem('swaglink_products');
    const savedCart = localStorage.getItem('swaglink_cart');

    if (savedProducts) {
        try { products = JSON.parse(savedProducts); } catch { products = []; }
    }

    if (!products.length) {
        products = [
            {
                id: 1,
                name: "Худи undercover x grace 2009",
                description: "Эксклюзивное худи. Оверсайз крой, качественный хлопок.",
                price: 4990,
                image: "images/hoodie-1.jpg",
                sizes: ["L", "M", "XL"]
            },
            {
                id: 2,
                name: "Лонгслив Gr Project x Nine Inch Nails",
                description: "Коллаборация с легендарной группой.",
                price: 3990,
                image: "images/longsleeve-nin.jpg",
                sizes: ["L", "M", "XL"]
            },
            {
                id: 3,
                name: "Худи undercover 1994",
                description: "Классическая модель, проверенная временем.",
                price: 5990,
                image: "images/hoodie-1994.png",
                sizes: ["L", "M", "XL"]
            }
        ];
        saveProducts();
    }

    if (savedCart) {
        try {
            cart = JSON.parse(savedCart).map(item => ({ ...item, qty: item.qty || 1 }));
        } catch { cart = []; }
    }
}

function saveProducts() {
    localStorage.setItem('swaglink_products', JSON.stringify(products));
}

function saveCart() {
    localStorage.setItem('swaglink_cart', JSON.stringify(cart));
}

// ============================================
// КАТАЛОГ
// ============================================
function renderProducts() {
    const container = document.getElementById('product-container');
    if (!container) return;

    if (!products.length) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: rgba(240,234,255,0.5); padding: 60px 0;">Каталог пуст</p>';
        return;
    }

    container.innerHTML = products.map((product, index) => `
        <div class="product-card" onclick="openProduct(${product.id})">
            <div class="product-image-wrapper">
                ${index === 0 ? '<div class="product-badge">Новинка</div>' : ''}
                <img src="${escapeHtml(product.image)}"
                     alt="${escapeHtml(product.name)}"
                     class="product-image"
                     loading="lazy"
                     onerror="this.src='https://picsum.photos/400/500'">
            </div>
            <div class="product-info">
                <div class="product-name">${escapeHtml(product.name)}</div>
                <div class="product-description">${escapeHtml(product.description)}</div>
                <div class="product-footer">
                    <div class="product-price">${Number(product.price).toLocaleString('ru-RU')} ₽</div>
                    <div class="product-btn-view">Смотреть →</div>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// КАРТОЧКА ТОВАРА
// ============================================
function openProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentProductId = productId;
    selectedSize = null;

    const container = document.getElementById('product-detail');
    if (!container) return;

    const sizesHtml = product.sizes.map(size => `
        <button class="size-btn" onclick="selectSize('${escapeHtml(size)}')">${escapeHtml(size)}</button>
    `).join('');

    container.innerHTML = `
        <div class="product-detail-container">
            <div class="product-detail-image">
                <img src="${escapeHtml(product.image)}"
                     alt="${escapeHtml(product.name)}"
                     onerror="this.src='https://picsum.photos/600/600'">
            </div>
            <div class="product-detail-info">
                <div class="product-detail-tag">ОРИГИНАЛ • ЛИМИТЕД</div>
                <h1 class="product-detail-name">${escapeHtml(product.name)}</h1>
                <div class="product-detail-price">${Number(product.price).toLocaleString('ru-RU')} ₽</div>
                <div class="product-detail-description">${escapeHtml(product.description)}</div>

                <div class="product-detail-sizes">
                    <h4>Выберите размер <span id="size-error" style="color: #ff6b6b; font-weight: 500; display: none;">— обязательно</span></h4>
                    <div class="size-options">${sizesHtml}</div>
                </div>

                <button class="btn-primary" onclick="addToCartFromDetail()">
                    🛒 Добавить в корзину
                </button>

                <div class="product-detail-perks">
                    <div class="perk-item"><span>🚀</span><span>Доставка 2-3 дня</span></div>
                    <div class="perk-item"><span>🔄</span><span>Возврат 14 дней</span></div>
                    <div class="perk-item"><span>⭐</span><span>Гарантия качества</span></div>
                </div>
            </div>
        </div>
    `;

    switchTab('product');
}

function selectSize(size) {
    selectedSize = size;
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === size);
    });
    const error = document.getElementById('size-error');
    if (error) error.style.display = 'none';
}

function addToCartFromDetail() {
    if (!selectedSize) {
        const error = document.getElementById('size-error');
        if (error) error.style.display = 'inline';
        showToast('Пожалуйста, выберите размер!', 'error');
        return;
    }

    const product = products.find(p => p.id === currentProductId);
    if (!product) return;

    const existing = cart.find(c => c.id === currentProductId && c.selectedSize === selectedSize);

    if (existing) {
        existing.qty += 1;
        showToast(`+1 к «${product.name}» (${selectedSize})`);
    } else {
        cart.push({ ...product, selectedSize, qty: 1 });
        showToast(`«${product.name}» (${selectedSize}) добавлен в корзину`);
    }

    saveCart();
    updateCartCount();
}

// ============================================
// КОРЗИНА
// ============================================
function renderCart() {
    const cartList = document.getElementById('cart-list');
    const cartEmpty = document.getElementById('cart-empty');
    const cartItems = document.getElementById('cart-items');
    const totalPrice = document.getElementById('cart-total-price');

    if (!cartList) return;

    if (cart.length === 0) {
        if (cartEmpty) cartEmpty.style.display = 'block';
        if (cartItems) cartItems.style.display = 'none';
        return;
    }

    if (cartEmpty) cartEmpty.style.display = 'none';
    if (cartItems) cartItems.style.display = 'block';

    cartList.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <img src="${escapeHtml(item.image)}"
                 alt="${escapeHtml(item.name)}"
                 class="cart-item-img"
                 loading="lazy"
                 onerror="this.src='https://picsum.photos/100/100'">
            <div class="cart-item-info">
                <div class="cart-item-name">${escapeHtml(item.name)}</div>
                <div class="cart-item-size">Размер: <strong>${escapeHtml(item.selectedSize)}</strong></div>
                <div class="cart-item-price">${Number(item.price).toLocaleString('ru-RU')} ₽</div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="changeQty(${index}, -1)">−</button>
                    <span class="qty-value">${item.qty}</span>
                    <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                </div>
            </div>
            <button class="btn-remove" onclick="removeFromCart(${index})">✕ Убрать</button>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    if (totalPrice) totalPrice.textContent = total.toLocaleString('ru-RU');
}

function changeQty(index, delta) {
    if (!cart[index]) return;
    cart[index].qty += delta;
    if (cart[index].qty < 1) cart[index].qty = 1;
    saveCart();
    renderCart();
    updateCartCount();
}

function removeFromCart(index) {
    const removed = cart[index];
    cart.splice(index, 1);
    saveCart();
    renderCart();
    updateCartCount();
    if (removed) showToast(`«${removed.name}» удалён из корзины`, 'info');
}

function updateCartCount() {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalQty;
    });
}

// ============================================
// ОФОРМЛЕНИЕ ЗАКАЗА — МОДАЛЬНОЕ ОКНО
// ============================================
function openCheckoutModal() {
    if (cart.length === 0) {
        showToast('Корзина пуста!', 'error');
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const totalEl = document.getElementById('checkout-total');
    if (totalEl) totalEl.textContent = total.toLocaleString('ru-RU');

    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.classList.add('modal-open');
    }
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}

function submitCheckout() {
    if (cart.length === 0) {
        showToast('Корзина пуста!', 'error');
        return;
    }

    const nameEl = document.getElementById('customer-name');
    const phoneEl = document.getElementById('customer-phone');
    const telegramEl = document.getElementById('customer-telegram');
    const addressEl = document.getElementById('customer-address');
    const commentEl = document.getElementById('customer-comment');

    const name = nameEl ? nameEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const telegram = telegramEl ? telegramEl.value.trim() : '';
    const address = addressEl ? addressEl.value.trim() : '';
    const comment = commentEl ? commentEl.value.trim() : '';

    if (!name || !phone || !telegram || !address) {
        showToast('Заполните все обязательные поля', 'error');
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const itemsText = cart
        .map(item => `• ${item.name} (разм. ${item.selectedSize}) × ${item.qty} — ${item.price * item.qty} ₽`)
        .join('\n');

    const message =
`🛍 НОВЫЙ ЗАКАЗ В SWAGLINK

📦 Товары:
${itemsText}

💰 Итого: ${total.toLocaleString('ru-RU')} ₽

👤 Покупатель:
• Имя: ${name}
• Телефон: ${phone}
• Telegram: ${telegram}
• Адрес: ${address}${comment ? `\n• Комментарий: ${comment}` : ''}`;

    window.open(`https://t.me/Lyka6474?text=${encodeURIComponent(message)}`, '_blank');

    closeCheckoutModal();
    showToast('Заказ отправлен! Менеджер свяжется с вами.', 'success');
}

// ============================================
// НАВИГАЦИЯ
// ============================================
function goBackToCatalog() {
    switchTab('catalog');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) {
        targetTab.classList.add('active');
    } else {
        return;
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.tab === tabId);
    });

    history.pushState(null, '', '#' + tabId);

    if (tabId === 'cart') renderCart();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// ЗАПУСК
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    loadData();
    renderProducts();
    renderCart();
    updateCartCount();

    document.querySelectorAll('[data-tab]').forEach(el => {
        el.addEventListener('click', function (e) {
            e.preventDefault();
            const tabId = this.dataset.tab;
            if (tabId) switchTab(tabId);
        });
    });

    if (window.location.hash) {
        const tabId = window.location.hash.replace('#', '');
        if (document.getElementById('tab-' + tabId)) switchTab(tabId);
    }

    window.addEventListener('popstate', () => {
        const tabId = window.location.hash.replace('#', '') || 'home';
        switchTab(tabId);
    });

    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeCheckoutModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeCheckoutModal();
    });

    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitCheckout();
        });
    }
});