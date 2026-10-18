// ============================================
// АВТО-ВЕРСИЯ
// ============================================
const APP_VERSION = 'v1.3';

(function checkAppVersion() {
    const savedVersion = localStorage.getItem('klin_app_version');
    if (savedVersion !== APP_VERSION) {
        localStorage.removeItem('klin_products_v1');
        localStorage.removeItem('klin_products_v2');
        localStorage.removeItem('klin_products_v3');
        localStorage.removeItem('klin_products');
        localStorage.removeItem('swaglink_products_v4');
        localStorage.removeItem('swaglink_products_v3');
        localStorage.removeItem('swaglink_products_v2');
        localStorage.removeItem('swaglink_products');
        localStorage.removeItem('klin_cart');
        localStorage.removeItem('swaglink_cart');
        localStorage.setItem('klin_app_version', APP_VERSION);
    }
})();

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

const ICONS = {
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
};

const PLACEHOLDER = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20500%22%3E%3Crect%20width%3D%22400%22%20height%3D%22500%22%20fill%3D%22%23F0F0F0%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22Helvetica%2CArial%22%20font-size%3D%22120%22%20font-weight%3D%22900%22%20fill%3D%22%23CCCCCC%22%3EK%3C%2Ftext%3E%3C%2Fsvg%3E';

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
// ЗАГРУЗКА / СОХРАНЕНИЕ
// ============================================
function loadData() {
    const savedProducts = localStorage.getItem('klin_products_v4');
    const savedCart = localStorage.getItem('klin_cart');

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
                images: [
                    "images/hoodie-1.jpg",
                    "images/hoodie-1-2.jpg",
                    "images/hoodie-1-3.jpg"
                ],
                sizes: ["L", "M", "XL"],
                category: "clothes"
            },
            {
                id: 2,
                name: "Лонгслив Gr Project x Nine Inch Nails",
                description: "Коллаборация с легендарной группой.",
                price: 3990,
                images: [
                    "images/longsleeve-nin.jpg",
                    "images/longsleeve-nin-2.jpg"
                ],
                sizes: ["L", "M", "XL"],
                category: "clothes"
            },
            {
                id: 3,
                name: "Худи undercover 1994",
                description: "Классическая модель, проверенная временем.",
                price: 5990,
                images: [
                    "images/hoodie-1994.png",
                    "images/hoodie-1994-2.png"
                ],
                sizes: ["L", "M", "XL"],
                category: "clothes"
            },
            {
                id: 8,
                name: "Набор носков Adidas",
                description: "Классическая модель, проверенная временем. 3 пары, размер 37-41.",
                price: 400,
                images: [
                    "images/socks-1.png"
                ],
                sizes: ["37-41"],
                category: "clothes"
            },
            {
                id: 4,
                name: "Часы WCS2 Серебро",
                description: "Кварцевый механизм. Гравировки на застёжке. Застёжка-клипса.",
                price: 1500,
                images: [
                    "images/watch-1.jpg",
                    "images/watch-1-2.jpg"
                ],
                sizes: ["ONE SIZE"],
                category: "watches"
            },
            {
                id: 5,
                name: "Часы WCS2 Серебро с чёрным циферблатом",
                description: "Кварцевый механизм. Гравировки на застёжке. Застёжка-клипса.",
                price: 1500,
                images: [
                    "images/watch-2.jpg",
                    "images/watch-2-2.jpg"
                ],
                sizes: ["ONE SIZE"],
                category: "watches"
            },
            {
                id: 6,
                name: "AirPods Pro 2",
                description: "Активное шумоподавление, до 6 часов работы.",
                price: 5000,
                images: [
                    "images/tech-1.jpg"
                ],
                sizes: ["ONE SIZE"],
                category: "tech"
            },
            {
                id: 7,
                name: "Беспроводной геймпад DualShock для PS4",
                description: "Контроллер для комфортного управления в играх. Беспроводное подключение Bluetooth.",
                price: 1999,
                images: [
                    "images/tech-2.jpg"
                ],
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
    localStorage.setItem('klin_products_v4', JSON.stringify(products));
}

function saveCart() {
    localStorage.setItem('klin_cart', JSON.stringify(cart));
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
        const firstImage = (product.images && product.images[0]) || product.image || PLACEHOLDER;

        return `
            <div class="product-card" onclick="openProduct(${product.id})">
                <div class="product-image-wrapper">
                    ${index === 0 && currentCategory === 'all' ? '<div class="product-badge">Новинка</div>' : ''}
                    ${catName ? `<div class="product-category-tag">${escapeHtml(catName)}</div>` : ''}
                    <img src="${escapeHtml(firstImage)}"
                         alt="${escapeHtml(product.name)}"
                         class="product-image"
                         loading="lazy"
                         onerror="this.src='${PLACEHOLDER}'">
                </div>
                <div class="product-info">
                    <div class="product-name">${escapeHtml(product.name)}</div>
                    <div class="product-description">${escapeHtml(product.description)}</div>
                    <div class="product-footer">
                        <div class="product-price">${Number(product.price).toLocaleString('ru-RU')}<span class="rub-card">₽</span></div>
                        <div class="product-btn-view">Смотреть ${ICONS.arrowRight}</div>
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
// КАРТОЧКА ТОВАРА С ГАЛЕРЕЕЙ
// ============================================
function openProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentProductId = productId;
    selectedSize = null;

    const container = document.getElementById('product-detail');
    if (!container) return;

    const catName = CATEGORY_NAMES[product.category] || 'ТОВАР';

    const images = (product.images && product.images.length)
        ? product.images
        : [product.image || PLACEHOLDER];

    const sizesHtml = product.sizes.map(size => `
        <button class="size-btn" onclick="selectSize('${escapeHtml(size)}')">${escapeHtml(size)}</button>
    `).join('');

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
                <div class="product-detail-tag">${escapeHtml(catName)} · ЛИМИТЕД</div>
                <h1 class="product-detail-name">${escapeHtml(product.name)}</h1>
                <div class="product-detail-price">${Number(product.price).toLocaleString('ru-RU')}<span class="rub-card">₽</span></div>
                <div class="product-detail-description">${escapeHtml(product.description)}</div>

                <div class="product-detail-sizes">
                    <h4>Выберите размер <span id="size-error" style="display: none;">— обязательно</span></h4>
                    <div class="size-options">${sizesHtml}</div>
                </div>

                <button class="btn btn-solid btn-add-cart" onclick="addToCartFromDetail()">
                    Добавить в корзину
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
        showToast('Выберите размер', 'error');
        return;
    }

    const product = products.find(p => p.id === currentProductId);
    if (!product) return;

    const existing = cart.find(c => c.id === currentProductId && c.selectedSize === selectedSize);

    const previewImage = (product.images && product.images[0]) || product.image || PLACEHOLDER;

    if (existing) {
        existing.qty += 1;
        showToast(`Добавлено ещё: ${product.name} (${selectedSize})`);
    } else {
        cart.push({ ...product, image: previewImage, selectedSize, qty: 1 });
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

    let touchStartX = 0;
    let touchEndX = 0;

    viewport.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    viewport.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) galleryNext();
            else galleryPrev();
        }
    }, { passive: true });

    document.addEventListener('keydown', handleGalleryKey);
    updateGalleryPosition();
}

function handleGalleryKey(e) {
    const lightbox = document.getElementById('lightbox');

    // Если открыт lightbox — работаем с ним
    if (lightbox && lightbox.classList.contains('active')) {
        if (e.key === 'ArrowLeft') lightboxPrev();
        if (e.key === 'ArrowRight') lightboxNext();
        if (e.key === 'Escape') closeLightbox();
        return;
    }

    // Иначе — галерея в карточке товара
    const productTab = document.getElementById('tab-product');
    if (!productTab || !productTab.classList.contains('active')) return;
    if (e.key === 'ArrowLeft') galleryPrev();
    if (e.key === 'ArrowRight') galleryNext();
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
    const product = products.find(p => p.id === currentProductId);
    if (!product) return;

    lightboxImages = (product.images && product.images.length)
        ? product.images
        : [product.image || PLACEHOLDER];

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
                 onerror="this.src='${PLACEHOLDER}'">
            <div class="cart-item-info">
                <div class="cart-item-name">${escapeHtml(item.name)}</div>
                <div class="cart-item-size">Размер: <strong>${escapeHtml(item.selectedSize)}</strong></div>
                <div class="cart-item-price">${Number(item.price).toLocaleString('ru-RU')}<span class="rub-card">₽</span></div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="changeQty(${index}, -1)" aria-label="Уменьшить">−</button>
                    <span class="qty-value">${item.qty}</span>
                    <button class="qty-btn" onclick="changeQty(${index}, 1)" aria-label="Увеличить">+</button>
                </div>
            </div>
            <button class="btn-remove" onclick="removeFromCart(${index})">Убрать</button>
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
    if (removed) showToast(`${removed.name} удалён`, 'info');
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
        showToast('Корзина пуста', 'error');
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

// ============================================
// ОФОРМЛЕНИЕ ЗАКАЗА — отправка через Cloudflare Worker
// ============================================
const WORKER_URL = 'https://klin-select-order.ivan-look07.workers.dev';

function submitCheckout() {
    if (cart.length === 0) {
        showToast('Корзина пуста', 'error');
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

    // Валидация
    if (name.length < 2) { showFieldError('customer-name', 'Введите имя (минимум 2 символа)'); return; }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 11) { showFieldError('customer-phone', 'Введите телефон полностью'); return; }
    if (telegram.length < 4) { showFieldError('customer-telegram', 'Введите Telegram в формате @username'); return; }
    if (address.length < 5) { showFieldError('customer-address', 'Введите полный адрес доставки'); return; }

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    // Формируем данные для Worker
    const orderData = {
        name: name,
        phone: phone,
        telegram: telegram,
        address: address,
        promo: promo,
        comment: comment,
        items: cart.map(item => ({
            name: item.name,
            size: item.selectedSize,
            qty: item.qty,
            price: item.price
        })),
        total: total
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
            showToast('✅ Заказ отправлен! Мы свяжемся с вами.');
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
function goBackToCatalog() { switchTab('catalog'); }

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
    initFaq();
    initScrollReveal();
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
    if (e.key === 'Escape') {
        closeCheckoutModal();
        closeLightbox();
    }
});

    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitCheckout();
        });
    }
});