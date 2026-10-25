// ============================================
// АВТО-ВЕРСИЯ
// ============================================
// При смене версии удаляем только устаревшие кэши.
// Корзину не трогаем — она мигрирует в loadCart().
const APP_VERSION = 'v1.4';

(function checkAppVersion() {
    const savedVersion = localStorage.getItem('klin_app_version');
    if (savedVersion !== APP_VERSION) {
        [
            'klin_products', 'klin_products_v1', 'klin_products_v2', 'klin_products_v3', 'klin_products_v4',
            'swaglink_products', 'swaglink_products_v2', 'swaglink_products_v3', 'swaglink_products_v4',
            'swaglink_cart'
        ].forEach(key => localStorage.removeItem(key));
        localStorage.setItem('klin_app_version', APP_VERSION);
    }
})();

// ============================================
// ДАННЫЕ
// ============================================
const products = typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
let cart = []; // [{ id, selectedSize, qty }] — цена и название всегда берутся из каталога
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

function formatPrice(value) {
    return Number(value).toLocaleString('ru-RU');
}

const CATEGORY_NAMES = {
    clothes: 'Одежда',
    watches: 'Часы',
    tech: 'Техника'
};

const AUTHENTICITY_NAMES = {
    original: 'Оригинал',
    replica: 'Реплика'
};

const ICONS = {
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
};

const PLACEHOLDER = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20500%22%3E%3Crect%20width%3D%22400%22%20height%3D%22500%22%20fill%3D%22%23F0F0F0%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22Helvetica%2CArial%22%20font-size%3D%22120%22%20font-weight%3D%22900%22%20fill%3D%22%23CCCCCC%22%3EK%3C%2Ftext%3E%3C%2Fsvg%3E';

function findProduct(id) {
    return products.find(p => p.id === id);
}

function getImages(product) {
    return (product.images && product.images.length)
        ? product.images
        : [product.image || PLACEHOLDER];
}

function getSizes(product) {
    return (Array.isArray(product.sizes) && product.sizes.length) ? product.sizes : ['ONE SIZE'];
}

function isSizeSoldOut(product, size) {
    return Array.isArray(product.soldOut) && product.soldOut.includes(size);
}

function isSoldOut(product) {
    return getSizes(product).every(size => isSizeSoldOut(product, size));
}

// ============================================
// ВАЛИДАЦИЯ
// ============================================
function sanitizeText(str, maxLength) {
    if (!str) return '';
    let s = String(str).replace(/[<>{}[\]\\|]/g, '').replace(/\s{2,}/g, ' ').trim();
    if (maxLength && s.length > maxLength) s = s.slice(0, maxLength);
    return s;
}

function sanitizeName(str) {
    if (!str) return '';
    let s = String(str).replace(/[^А-Яа-яЁёA-Za-z\s\-']/g, '').replace(/\s{2,}/g, ' ').trim();
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
    let s = String(str).replace(/[<>{}[\]\\|]/g, '').replace(/\s{2,}/g, ' ').trim();
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
    el.style.outline = '2px solid #000';
    el.focus();
    showToast(message, 'error');
    setTimeout(() => { el.style.outline = ''; }, 2500);
}

// ============================================
// TOAST
// ============================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const labels = { success: 'OK', error: 'ОШИБКА', info: 'ИНФО' };

    toast.innerHTML = `
        <span class="toast-label">${labels[type] || 'OK'}</span>
        <span class="toast-text">${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-show'));
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// БЕГУЩАЯ СТРОКА
// ============================================
function initMarquee() {
    const track = document.getElementById('marquee-track');
    if (!track) return;

    const phrases = ['KLIN SELECT', 'FASHION', 'TECH', 'ACCESSORIES', 'CURATED FOR YOUR EVERYDAY'];
    const repeats = 6;

    let inner = '';
    for (let i = 0; i < repeats; i++) {
        inner += phrases.map(p => `<span>${p}</span>`).join('');
    }

    const groupHTML = `<div class="marquee-group">${inner}</div>`;
    track.innerHTML = groupHTML + groupHTML;
}

// ============================================
// FAQ
// ============================================
function initFaq() {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach(item => {
        const btn = item.querySelector('.faq-question');
        if (!btn) return;

        btn.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');

            items.forEach(other => {
                other.classList.remove('open');
                const otherBtn = other.querySelector('.faq-question');
                if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
            });

            if (!isOpen) {
                item.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

// ============================================
// SCROLL REVEAL
// ============================================
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    if (!('IntersectionObserver' in window)) {
        reveals.forEach(el => el.classList.add('reveal-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => observer.observe(el));
}

// ============================================
// КОРЗИНА — ЗАГРУЗКА / СОХРАНЕНИЕ
// ============================================
function loadCart() {
    const savedCart = localStorage.getItem('klin_cart');
    if (!savedCart) return;

    try {
        // Старый формат хранил весь объект товара — оставляем только id, размер и количество
        cart = JSON.parse(savedCart)
            .map(item => ({
                id: Number(item.id),
                selectedSize: String(item.selectedSize ?? ''),
                qty: Math.max(1, parseInt(item.qty, 10) || 1)
            }))
            .filter(item => findProduct(item.id));
    } catch {
        cart = [];
    }
    saveCart();
}

function saveCart() {
    localStorage.setItem('klin_cart', JSON.stringify(cart));
}

function getCartLines() {
    return cart
        .map((item, index) => ({ ...item, index, product: findProduct(item.id) }))
        .filter(line => line.product);
}

function getCartTotal() {
    return getCartLines().reduce((sum, line) => sum + line.product.price * line.qty, 0);
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
                <p>В этой категории пока нет товаров</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map((product, index) => {
        const catName = CATEGORY_NAMES[product.category] || '';
        const [firstImage, secondImage] = getImages(product);
        const soldOut = isSoldOut(product);

        let badge = '';
        if (soldOut) badge = '<div class="product-badge product-badge-outline">Нет в наличии</div>';
        else if (index === 0 && currentCategory === 'all') badge = '<div class="product-badge">Новинка</div>';

        const classes = ['product-card'];
        if (secondImage) classes.push('has-second');
        if (soldOut) classes.push('is-sold-out');

        return `
            <a href="#product/${product.id}" class="${classes.join(' ')}" data-id="${product.id}">
                <div class="product-image-wrapper">
                    ${badge}
                    <img src="${escapeHtml(firstImage)}"
                         alt="${escapeHtml(product.name)}"
                         class="product-image product-image-first"
                         loading="lazy"
                         onerror="this.src='${PLACEHOLDER}'">
                    ${secondImage ? `<img src="${escapeHtml(secondImage)}"
                         alt=""
                         class="product-image product-image-second"
                         loading="lazy"
                         onerror="this.remove()">` : ''}
                </div>
                <div class="product-info">
                    ${catName ? `<span class="product-category">${escapeHtml(catName)}</span>` : ''}
                    <div class="product-row">
                        <span class="product-name">${escapeHtml(product.name)}</span>
                        <span class="product-price">${formatPrice(product.price)}<span class="rub-card">₽</span></span>
                    </div>
                </div>
            </a>
        `;
    }).join('');
}

function renderCategoryCounts() {
    const visible = products.filter(p => !p.hidden);
    document.querySelectorAll('.category-btn').forEach(btn => {
        const category = btn.dataset.category;
        const count = category === 'all'
            ? visible.length
            : visible.filter(p => p.category === category).length;
        let badge = btn.querySelector('.category-count');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'category-count';
            btn.appendChild(badge);
        }
        badge.textContent = count;
    });
}

// ============================================
// ФИЛЬТР КАТЕГОРИЙ
// ============================================
function filterByCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.category-btn').forEach(btn => {
        const isActive = btn.dataset.category === category;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', String(isActive));
    });
    renderProducts();
}

// ============================================
// КАРТОЧКА ТОВАРА С ГАЛЕРЕЕЙ
// ============================================
function renderSizeChart(chart) {
    if (!chart || !Array.isArray(chart.columns) || !Array.isArray(chart.rows) || !chart.rows.length) return '';

    return `
        <details class="size-chart">
            <summary>Таблица размеров, см</summary>
            <div class="size-chart-scroll">
                <table>
                    <thead>
                        <tr>${chart.columns.map(col => `<th>${escapeHtml(col)}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${chart.rows.map(row => `
                            <tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </details>
    `;
}

function openProduct(productId, { push = true } = {}) {
    const product = findProduct(productId);
    if (!product || product.hidden) {
        switchTab('catalog', { push });
        return;
    }

    currentProductId = productId;
    selectedSize = null;

    const container = document.getElementById('product-detail');
    if (!container) return;

    const catName = CATEGORY_NAMES[product.category] || 'ТОВАР';
    const authName = AUTHENTICITY_NAMES[product.authenticity];
    const images = getImages(product);
    const sizes = getSizes(product);
    const soldOut = isSoldOut(product);

    // Если размер один и он в наличии — выбираем его сразу
    if (sizes.length === 1 && !soldOut) selectedSize = sizes[0];

    const sizesHtml = sizes.map(size => {
        const sizeSoldOut = isSizeSoldOut(product, size);
        return `
            <button type="button"
                    class="size-btn${size === selectedSize ? ' active' : ''}${sizeSoldOut ? ' is-sold-out' : ''}"
                    data-size="${escapeHtml(size)}"
                    ${sizeSoldOut ? 'disabled aria-label="' + escapeHtml(size) + ' — нет в наличии"' : ''}>${escapeHtml(size)}</button>
        `;
    }).join('');

    const galleryHtml = `
    <div class="product-gallery" data-total="${images.length}">
        <div class="product-gallery-viewport">
            <div class="product-gallery-track" id="gallery-track">
                ${images.map((src, i) => `
                    <div class="product-gallery-slide" onclick="openLightbox(${i})" role="button" tabindex="0" aria-label="Открыть фото ${i + 1}">
                        <img src="${escapeHtml(src)}"
                             alt="${escapeHtml(product.name)} — фото ${i + 1}"
                             draggable="false"
                             onerror="this.src='${PLACEHOLDER}'">
                    </div>
                `).join('')}
            </div>

            ${images.length > 1 ? `
                <button type="button" class="gallery-arrow gallery-prev" onclick="event.stopPropagation(); galleryPrev()" aria-label="Предыдущее фото">←</button>
                <button type="button" class="gallery-arrow gallery-next" onclick="event.stopPropagation(); galleryNext()" aria-label="Следующее фото">→</button>
                <div class="gallery-counter">
                    <span id="gallery-current">1</span> / <span>${images.length}</span>
                </div>
            ` : ''}
        </div>

        ${images.length > 1 ? `
            <div class="gallery-dots" id="gallery-dots">
                ${images.map((_, i) => `
                    <button type="button" class="gallery-dot ${i === 0 ? 'active' : ''}"
                            onclick="event.stopPropagation(); galleryGoTo(${i})"
                            aria-label="Фото ${i + 1}"></button>
                `).join('')}
            </div>
        ` : ''}
    </div>
`;

    container.innerHTML = `
        <div class="product-detail-container">
            ${galleryHtml}
            <div class="product-detail-info">
                <div class="product-detail-tag">${escapeHtml(catName)}${authName ? ' · ' + escapeHtml(authName) : ''}</div>
                <h1 class="product-detail-name">${escapeHtml(product.name)}</h1>
                <div class="product-detail-price">${formatPrice(product.price)}<span class="rub-card">₽</span></div>
                <div class="product-detail-description">${escapeHtml(product.description)}</div>

                <div class="product-detail-sizes">
                    <h4>Выберите размер <span id="size-error" style="display: none;">— обязательно</span></h4>
                    <div class="size-options">${sizesHtml}</div>
                    ${renderSizeChart(product.sizeChart)}
                </div>

                <button type="button" class="btn btn-solid btn-add-cart" onclick="addToCartFromDetail()" ${soldOut ? 'disabled' : ''}>
                    ${soldOut ? 'Нет в наличии' : 'Добавить в корзину'}
                    ${ICONS.arrowRight}
                </button>

                <div class="product-detail-perks">
                    <div class="perk-item">Доставка в день заказа по Иваново</div>
                    <div class="perk-item">Возврат 14 дней</div>
                    <div class="perk-item">Оригинал и реплики</div>
                </div>
            </div>
        </div>
    `;

    initGallery();
    switchTab('product', { push, hash: 'product/' + productId });
}

function selectSize(size) {
    const product = findProduct(currentProductId);
    if (!product || isSizeSoldOut(product, size)) return;

    selectedSize = size;
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.size === size);
    });
    const error = document.getElementById('size-error');
    if (error) error.style.display = 'none';
}

function addToCartFromDetail() {
    const product = findProduct(currentProductId);
    if (!product) return;

    if (!selectedSize) {
        const error = document.getElementById('size-error');
        if (error) error.style.display = 'inline';
        showToast('Выберите размер', 'error');
        return;
    }

    if (isSizeSoldOut(product, selectedSize)) {
        showToast('Этого размера нет в наличии', 'error');
        return;
    }

    const existing = cart.find(c => c.id === currentProductId && c.selectedSize === selectedSize);

    if (existing) {
        existing.qty += 1;
        showToast(`Добавлено ещё: ${product.name} (${selectedSize})`);
    } else {
        cart.push({ id: currentProductId, selectedSize, qty: 1 });
        showToast(`${product.name} (${selectedSize}) в корзине`);
    }

    saveCart();
    updateCartCount();
}

// ============================================
// ГАЛЕРЕЯ
// ============================================
let galleryIndex = 0;
let galleryTotal = 0;

function initGallery() {
    const track = document.getElementById('gallery-track');
    const viewport = track?.parentElement;
    if (!track || !viewport) return;

    const slides = track.querySelectorAll('.product-gallery-slide');
    galleryTotal = slides.length;
    galleryIndex = 0;

    // viewport создаётся заново при каждом открытии товара,
    // поэтому слушатели свайпа не накапливаются
    let touchStartX = 0;

    viewport.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    viewport.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) galleryNext();
            else galleryPrev();
        }
    }, { passive: true });

    updateGalleryPosition();
}

function updateGalleryPosition() {
    const track = document.getElementById('gallery-track');
    if (!track) return;

    track.style.transform = `translateX(-${galleryIndex * 100}%)`;

    document.querySelectorAll('.gallery-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === galleryIndex);
    });

    const counter = document.getElementById('gallery-current');
    if (counter) counter.textContent = galleryIndex + 1;
}

function galleryNext() {
    if (galleryTotal <= 1) return;
    galleryIndex = (galleryIndex + 1) % galleryTotal;
    updateGalleryPosition();
}

function galleryPrev() {
    if (galleryTotal <= 1) return;
    galleryIndex = (galleryIndex - 1 + galleryTotal) % galleryTotal;
    updateGalleryPosition();
}

function galleryGoTo(index) {
    if (index < 0 || index >= galleryTotal) return;
    galleryIndex = index;
    updateGalleryPosition();
}

// ============================================
// LIGHTBOX — полноэкранный просмотр фото
// ============================================
let lightboxImages = [];
let lightboxIndex = 0;

function openLightbox(index) {
    const product = findProduct(currentProductId);
    if (!product) return;

    lightboxImages = getImages(product);
    lightboxIndex = index || 0;

    // Создаём DOM lightbox, если его нет
    let lightbox = document.getElementById('lightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'lightbox';
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <button type="button" class="lightbox-close" onclick="closeLightbox()" aria-label="Закрыть">✕</button>
            <button type="button" class="lightbox-arrow lightbox-prev" onclick="event.stopPropagation(); lightboxPrev()" aria-label="Предыдущее фото">←</button>
            <button type="button" class="lightbox-arrow lightbox-next" onclick="event.stopPropagation(); lightboxNext()" aria-label="Следующее фото">→</button>
            <div class="lightbox-counter">
                <span id="lightbox-current">1</span> / <span id="lightbox-total">1</span>
            </div>
            <div class="lightbox-stage">
                <img id="lightbox-image" src="" alt="" draggable="false">
            </div>
        `;

        // Клик на фон — закрыть
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });

        // Свайп на телефоне
        let touchStartX = 0;
        lightbox.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        lightbox.addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) lightboxNext();
                else lightboxPrev();
            }
        }, { passive: true });

        document.body.appendChild(lightbox);
    }

    // Скрываем стрелки, если фото одно
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    const counter = lightbox.querySelector('.lightbox-counter');
    const showNav = lightboxImages.length > 1;

    prevBtn.style.display = showNav ? 'flex' : 'none';
    nextBtn.style.display = showNav ? 'flex' : 'none';
    counter.style.display = showNav ? 'block' : 'none';

    // Обновляем счётчик
    document.getElementById('lightbox-total').textContent = lightboxImages.length;

    lightbox.classList.add('active');
    document.body.classList.add('modal-open');

    updateLightbox();
}

function updateLightbox() {
    const img = document.getElementById('lightbox-image');
    if (!img) return;

    img.src = lightboxImages[lightboxIndex];
    img.alt = `Фото ${lightboxIndex + 1}`;

    const counter = document.getElementById('lightbox-current');
    if (counter) counter.textContent = lightboxIndex + 1;
}

function isLightboxOpen() {
    const lightbox = document.getElementById('lightbox');
    return !!lightbox && lightbox.classList.contains('active');
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    lightbox.classList.remove('active');
    document.body.classList.remove('modal-open');
}

function lightboxNext() {
    if (lightboxImages.length <= 1) return;
    lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
    updateLightbox();
}

function lightboxPrev() {
    if (lightboxImages.length <= 1) return;
    lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
    updateLightbox();
}

// ============================================
// КЛАВИАТУРА — единый обработчик
// ============================================
function handleKeydown(e) {
    if (isLightboxOpen()) {
        if (e.key === 'ArrowLeft') lightboxPrev();
        if (e.key === 'ArrowRight') lightboxNext();
        if (e.key === 'Escape') closeLightbox();
        return;
    }

    if (isCheckoutModalOpen()) {
        if (e.key === 'Escape') closeCheckoutModal();
        return;
    }

    // Не листаем галерею, когда пользователь печатает
    if (e.target instanceof Element && e.target.closest('input, textarea')) return;

    const productTab = document.getElementById('tab-product');
    if (!productTab || !productTab.classList.contains('active')) return;
    if (e.key === 'ArrowLeft') galleryPrev();
    if (e.key === 'ArrowRight') galleryNext();
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

    const lines = getCartLines();

    if (lines.length === 0) {
        if (cartEmpty) cartEmpty.style.display = 'block';
        if (cartItems) cartItems.style.display = 'none';
        return;
    }

    if (cartEmpty) cartEmpty.style.display = 'none';
    if (cartItems) cartItems.style.display = 'block';

    cartList.innerHTML = lines.map(({ product, selectedSize: size, qty, index }) => `
        <div class="cart-item">
            <img src="${escapeHtml(getImages(product)[0])}"
                 alt="${escapeHtml(product.name)}"
                 class="cart-item-img"
                 loading="lazy"
                 onerror="this.src='${PLACEHOLDER}'">
            <div class="cart-item-info">
                <a href="#product/${product.id}" class="cart-item-name">${escapeHtml(product.name)}</a>
                <div class="cart-item-size">Размер: <strong>${escapeHtml(size)}</strong></div>
                <div class="cart-item-price">${formatPrice(product.price)}<span class="rub-card">₽</span></div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="changeQty(${index}, -1)" aria-label="Уменьшить">−</button>
                    <span class="qty-value">${qty}</span>
                    <button class="qty-btn" onclick="changeQty(${index}, 1)" aria-label="Увеличить">+</button>
                </div>
            </div>
            <button class="btn-remove" onclick="removeFromCart(${index})">Убрать</button>
        </div>
    `).join('');

    if (totalPrice) totalPrice.textContent = formatPrice(getCartTotal());
}

function changeQty(index, delta) {
    if (!cart[index]) return;
    cart[index].qty = Math.min(99, Math.max(1, cart[index].qty + delta));
    saveCart();
    renderCart();
    updateCartCount();
}

function removeFromCart(index) {
    const removed = cart[index];
    if (!removed) return;
    cart.splice(index, 1);
    saveCart();
    renderCart();
    updateCartCount();
    const product = findProduct(removed.id);
    if (product) showToast(`${product.name} удалён`, 'info');
}

function updateCartCount() {
    const totalQty = getCartLines().reduce((sum, line) => sum + line.qty, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalQty;
    });
}

// ============================================
// ОФОРМЛЕНИЕ ЗАКАЗА
// ============================================
function openCheckoutModal() {
    if (getCartLines().length === 0) {
        showToast('Корзина пуста', 'error');
        return;
    }

    const totalEl = document.getElementById('checkout-total');
    if (totalEl) totalEl.textContent = formatPrice(getCartTotal());

    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.classList.add('modal-open');
    }
}

function isCheckoutModalOpen() {
    const modal = document.getElementById('checkout-modal');
    return !!modal && modal.classList.contains('active');
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal && modal.classList.contains('active')) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}

// ============================================
// ОФОРМЛЕНИЕ ЗАКАЗА — отправка через Cloudflare Worker
// ============================================
const WORKER_URL = 'https://klin-select-order.ivan-look07.workers.dev';

function submitCheckout() {
    const lines = getCartLines();
    if (lines.length === 0) {
        showToast('Корзина пуста', 'error');
        return;
    }

    const nameEl = document.getElementById('customer-name');
    const phoneEl = document.getElementById('customer-phone');
    const telegramEl = document.getElementById('customer-telegram');
    const addressEl = document.getElementById('customer-address');
    const promoEl = document.getElementById('customer-promo');
    const commentEl = document.getElementById('customer-comment');
    const consentEl = document.getElementById('customer-consent');

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

    // Валидация
    if (name.length < 2) { showFieldError('customer-name', 'Введите имя (минимум 2 символа)'); return; }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 11) { showFieldError('customer-phone', 'Введите телефон полностью'); return; }
    if (telegram.length < 4) { showFieldError('customer-telegram', 'Введите Telegram в формате @username'); return; }
    if (address.length < 5) { showFieldError('customer-address', 'Введите полный адрес доставки'); return; }
    if (consentEl && !consentEl.checked) { showFieldError('customer-consent', 'Нужно согласие на обработку данных'); return; }

    // Формируем данные для Worker.
    // id и size — главное: Worker должен сам брать цену по id и пересчитывать итог.
    // name, price и total оставлены для совместимости и сверки.
    const orderData = {
        name: name,
        phone: phone,
        telegram: telegram,
        address: address,
        promo: promo,
        comment: comment,
        consent: true,
        items: lines.map(line => ({
            id: line.product.id,
            name: line.product.name,
            size: line.selectedSize,
            qty: line.qty,
            price: line.product.price
        })),
        total: getCartTotal()
    };

    // Блокируем кнопку отправки на время запроса
    const submitBtn = document.querySelector('#checkout-form button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Отправка...';
    }

    // Отправляем в Cloudflare Worker
    fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok) {
            // Успех
            showToast('Заказ отправлен! Мы свяжемся с вами.');
            closeCheckoutModal();

            // Очищаем корзину
            cart = [];
            saveCart();
            renderCart();
            updateCartCount();

            // Очищаем поля формы
            if (nameEl) nameEl.value = '';
            if (phoneEl) phoneEl.value = '';
            if (telegramEl) telegramEl.value = '';
            if (addressEl) addressEl.value = '';
            if (promoEl) promoEl.value = '';
            if (commentEl) commentEl.value = '';
            if (consentEl) consentEl.checked = false;
        } else {
            showToast('Ошибка: ' + (data.error || 'попробуйте позже'), 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка отправки заказа:', error);
        showToast('Ошибка сети. Проверьте соединение и попробуйте снова.', 'error');
    })
    .finally(() => {
        // Разблокируем кнопку
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}

// ============================================
// НАВИГАЦИЯ
// ============================================
// Адреса: #home, #catalog, #contacts, #cart, #privacy, #product/<id>
function goBackToCatalog() { switchTab('catalog'); }

function switchTab(tabId, { push = true, hash = tabId } = {}) {
    const targetTab = document.getElementById('tab-' + tabId);
    if (!targetTab) return;

    closeCheckoutModal();

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    targetTab.classList.add('active');

    // Карточка товара — часть каталога, подсвечиваем его в меню
    const navTab = tabId === 'product' ? 'catalog' : tabId;
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.tab === navTab);
    });

    if (push && window.location.hash !== '#' + hash) {
        history.pushState(null, '', '#' + hash);
    }

    if (tabId === 'cart') renderCart();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function routeFromHash() {
    const [tabId, param] = window.location.hash.replace('#', '').split('/');

    if (tabId === 'product') {
        openProduct(Number(param), { push: false });
        return;
    }

    switchTab(document.getElementById('tab-' + tabId) ? tabId : 'home', { push: false });
}

// ============================================
// ЗАПУСК
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    initFaq();
    initScrollReveal();
    initMarquee();

    loadCart();
    renderCategoryCounts();
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

    const logo = document.querySelector('.logo[data-tab]');
    if (logo) {
        logo.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                switchTab('home');
            }
        });
    }

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            filterByCategory(this.dataset.category);
        });
    });

    // Карточки каталога — это ссылки #product/<id>, открываем без перезагрузки
    const productContainer = document.getElementById('product-container');
    if (productContainer) {
        productContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card[data-id]');
            if (!card) return;
            e.preventDefault();
            openProduct(Number(card.dataset.id));
        });
    }

    // Выбор размера — через data-size, без подстановки строк в onclick
    const productDetail = document.getElementById('product-detail');
    if (productDetail) {
        productDetail.addEventListener('click', (e) => {
            const btn = e.target.closest('.size-btn[data-size]');
            if (btn && !btn.disabled) selectSize(btn.dataset.size);
        });
    }

    // Ссылка на товар из корзины
    const cartList = document.getElementById('cart-list');
    if (cartList) {
        cartList.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#product/"]');
            if (!link) return;
            e.preventDefault();
            openProduct(Number(link.getAttribute('href').split('/')[1]));
        });
    }

    routeFromHash();
    window.addEventListener('popstate', routeFromHash);

    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeCheckoutModal();
        });
    }

    document.addEventListener('keydown', handleKeydown);

    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitCheckout();
        });
    }
});
