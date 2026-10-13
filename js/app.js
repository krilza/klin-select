// В самом начале js/app.js, до всех функций

const APP_VERSION = 'v1.1'; // <-- МЕНЯЙ ЭТУ ЦИФРУ при больших обновлениях каталога

// Проверяем, совпадает ли версия
if (localStorage.getItem('swaglink_app_version') !== APP_VERSION) {
    // Если версия новая, а данные старые — очищаем старый кэш
    localStorage.removeItem('swaglink_products_v4');
    localStorage.removeItem('swaglink_products_v3');
    localStorage.removeItem('swaglink_products_v2');
    localStorage.removeItem('swaglink_products');
    localStorage.removeItem('swaglink_cart'); // Корзину тоже лучше сбросить, если формат изменился
    
    // Записываем, что мы уже обновились до новой версии
    localStorage.setItem('swaglink_app_version', APP_VERSION);
}
// ============================================
// ДАННЫЕ
// ============================================
let products = [];
let cart = [];
let selectedSize = null;
let currentProductId = null;
let currentCategory = 'all';

// ============================================
// ХЕЛПЕР
// ============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text ?? '');
    return div.innerHTML;
}

const CATEGORY_NAMES = {
    clothes: 'Одежда',
    watches: 'Часы',
    tech: 'Техника'
};

// ============================================
// ВАЛИДАЦИЯ ВВОДА
// ============================================
function sanitizeText(str, maxLength) {
    if (!str) return '';
    let s = String(str)
        .replace(/[<>{}[\]\\|]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    if (maxLength && s.length > maxLength) s = s.slice(0, maxLength);
    return s;
}

function sanitizeName(str) {
    if (!str) return '';
    let s = String(str)
        .replace(/[^А-Яа-яЁёA-Za-z\s\-']/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    return s.slice(0, 60);
}

function formatPhone(str) {
    let digits = String(str || '').replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (digits.length && !digits.startsWith('7')) digits = '7' + digits;
    digits = digits.slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 1) return '+7';
    if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
    if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

function sanitizeTelegram(str) {
    if (!str) return '';
    let s = String(str).trim().replace(/^@+/, '');
    s = s.replace(/[^A-Za-z0-9_]/g, '').slice(0, 32);
    return s ? '@' + s : '';
}

function sanitizeAddress(str) {
    if (!str) return '';
    let s = String(str)
        .replace(/[<>{}[\]\\|]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    return s.slice(0, 200);
}

function sanitizeComment(str) {
    if (!str) return '';
    let s = String(str).replace(/[<>{}[\]\\|]/g, '').trim();
    return s.slice(0, 300);
}

function showFieldError(id, message) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = '#ff6b6b';
    el.style.boxShadow = '0 0 0 4px rgba(255, 107, 107, 0.15)';
    showToast(message, 'error');
    setTimeout(() => {
        el.style.borderColor = '';
        el.style.boxShadow = '';
    }, 2500);
}

// ============================================
// TOAST
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
// БЕГУЩАЯ СТРОКА
// ============================================
function initMarquee() {
    const track = document.getElementById('marquee-track');
    if (!track) return;

    const phrases = ['✦ ОДЕЖДА', '✦ ЧАСЫ', '✦ ТЕХНИКА', '✦ КАЧЕСТВО', '✦ ИВАНОВО'];
    const repeats = 6;

    let inner = '';
    for (let i = 0; i < repeats; i++) {
        inner += phrases.map(p => `<span>${p}</span>`).join('');
    }

    const groupHTML = `<div class="marquee-group">${inner}</div>`;
    track.innerHTML = groupHTML + groupHTML;
}

// ============================================
// ЗАГРУЗКА / СОХРАНЕНИЕ
// ============================================
function loadData() {
    const savedProducts = localStorage.getItem('swaglink_products_v4');
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
                sizes: ["L", "M", "XL"],
                category: "clothes"
            },
            {
                id: 2,
                name: "Лонгслив Gr Project x Nine Inch Nails",
                description: "Коллаборация с легендарной группой.",
                price: 3990,
                image: "images/longsleeve-nin.jpg",
                sizes: ["L", "M", "XL"],
                category: "clothes"
            },
            {
                id: 3,
                name: "Худи undercover 1994",
                description: "Классическая модель, проверенная временем.",
                price: 5990,
                image: "images/hoodie-1994.png",
                sizes: ["L", "M", "XL"],
                category: "clothes"
            },
            {
                id: 8,
                name: "Набор носков Adidas",
                description: "Классическая модель, проверенная временем. 3 пары, размер 37-41.",
                price: 400,
                image: "images/socks-1.png",
                sizes: ["37-41"],
                category: "clothes"
            },
            {
                id: 4,
                name: "Часы WCS2 Серебро",
                description: "Кварцевый механизм. Гравировки на застёжке. Застёжка-клипса.",
                price: 1500,
                image: "images/watch-1.jpg",
                sizes: ["ONE SIZE"],
                category: "watches"
            },
            {
                id: 5,
                name: "Часы WCS2 Серебро с чёрным циферблатом",
                description: "Кварцевый механизм. Гравировки на застёжке. Застёжка-клипса.",
                price: 1500,
                image: "images/watch-2.jpg",
                sizes: ["ONE SIZE"],
                category: "watches"
            },
            {
                id: 6,
                name: "AirPods Pro 2",
                description: "Активное шумоподавление, до 6 часов работы.",
                price: 5000,
                image: "images/tech-1.jpg",
                sizes: ["ONE SIZE"],
                category: "tech"
            },
            {
                id: 7,
                name: "Беспроводной геймпад DualShock для PS4",
                description: "Контроллер для комфортного управления в играх. Беспроводное подключение Bluetooth.",
                price: 1999,
                image: "images/tech-2.jpg",
                sizes: ["ONE SIZE"],
                category: "tech"
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
    localStorage.setItem('swaglink_products_v4', JSON.stringify(products));
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

    const visible = products.filter(p => !p.hidden);
    const filtered = currentCategory === 'all'
        ? visible
        : visible.filter(p => p.category === currentCategory);

    if (!filtered.length) {
        container.innerHTML = `
            <div class="catalog-empty">
                <span class="catalog-empty-icon">📦</span>
                <p>В этой категории пока нет товаров</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map((product, index) => {
        const catName = CATEGORY_NAMES[product.category] || '';
        return `
            <div class="product-card" onclick="openProduct(${product.id})">
                <div class="product-image-wrapper">
                    ${index === 0 && currentCategory === 'all' ? '<div class="product-badge">Новинка</div>' : ''}
                    ${catName ? `<div class="product-category-tag">${escapeHtml(catName)}</div>` : ''}
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
                        <div class="product-price">${Number(product.price).toLocaleString('ru-RU')}<span class="rub-card">₽</span></div>
                        <div class="product-btn-view">Смотреть →</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// ФИЛЬТР КАТЕГОРИЙ
// ============================================
function filterByCategory(category) {
    currentCategory = category;

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });

    renderProducts();
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

    const catName = CATEGORY_NAMES[product.category] || 'ТОВАР';

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
                <div class="product-detail-tag">${escapeHtml(catName)} • ЛИМИТЕД</div>
                <h1 class="product-detail-name">${escapeHtml(product.name)}</h1>
                <div class="product-detail-price">${Number(product.price).toLocaleString('ru-RU')}<span class="rub-card">₽</span></div>
                <div class="product-detail-description">${escapeHtml(product.description)}</div>

                <div class="product-detail-sizes">
                    <h4>Выберите размер <span id="size-error" style="color: #ff6b6b; font-weight: 500; display: none;">— обязательно</span></h4>
                    <div class="size-options">${sizesHtml}</div>
                </div>

                <button class="btn-primary" onclick="addToCartFromDetail()">
                    🛒 Добавить в корзину
                </button>

                <div class="product-detail-perks">
                    <div class="perk-item"><span>⚡</span><span>Доставка в день заказа по Иваново</span></div>
                    <div class="perk-item"><span>🔄</span><span>Возврат 14 дней</span></div>
                    <div class="perk-item"><span>⭐</span><span>Оригинал и реплики</span></div>
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
                <div class="cart-item-price">${Number(item.price).toLocaleString('ru-RU')}<span class="rub-card">₽</span></div>
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
// ОФОРМЛЕНИЕ ЗАКАЗА
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
    const promoEl = document.getElementById('customer-promo');
    const commentEl = document.getElementById('customer-comment');

    const name = sanitizeName(nameEl ? nameEl.value : '');
    const phone = formatPhone(phoneEl ? phoneEl.value : '');
    const telegram = sanitizeTelegram(telegramEl ? telegramEl.value : '');
    const address = sanitizeAddress(addressEl ? addressEl.value : '');
    const promo = sanitizeText(promoEl ? promoEl.value : '', 20).toUpperCase();
    const comment = sanitizeComment(commentEl ? commentEl.value : '');

    if (nameEl) nameEl.value = name;
    if (phoneEl) phoneEl.value = phone;
    if (telegramEl) telegramEl.value = telegram;
    if (addressEl) addressEl.value = address;
    if (promoEl) promoEl.value = promo;
    if (commentEl) commentEl.value = comment;

    if (name.length < 2) {
        showFieldError('customer-name', 'Введите имя (только буквы, минимум 2 символа)');
        return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 11) {
        showFieldError('customer-phone', 'Введите телефон полностью: +7 (XXX) XXX-XX-XX');
        return;
    }

    if (telegram.length < 4) {
        showFieldError('customer-telegram', 'Введите Telegram в формате @username');
        return;
    }

    if (address.length < 5) {
        showFieldError('customer-address', 'Введите полный адрес доставки (минимум 5 символов)');
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
${promo ? `🎁 Промокод: ${promo}` : ''}

👤 Покупатель:
• Имя: ${name}
• Телефон: ${phone}
• Telegram: ${telegram}
• Адрес: ${address}${comment ? `\n• Комментарий: ${comment}` : ''}`;

    window.open(`https://t.me/SwaglinkShop_bot?text=${encodeURIComponent(message)}`, '_blank');

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
    initMarquee();

    loadData();
    renderProducts();
    renderCart();
    updateCartCount();

    const phoneEl = document.getElementById('customer-phone');
    if (phoneEl) {
        phoneEl.addEventListener('input', function () {
            this.value = formatPhone(this.value);
        });
    }

    const telegramEl = document.getElementById('customer-telegram');
    if (telegramEl) {
        telegramEl.addEventListener('blur', function () {
            this.value = sanitizeTelegram(this.value);
        });
    }

    const nameEl = document.getElementById('customer-name');
    if (nameEl) {
        nameEl.addEventListener('blur', function () {
            this.value = sanitizeName(this.value);
        });
    }

    document.querySelectorAll('[data-tab]').forEach(el => {
        el.addEventListener('click', function (e) {
            e.preventDefault();
            const tabId = this.dataset.tab;
            if (tabId) switchTab(tabId);
        });
    });

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            filterByCategory(this.dataset.category);
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