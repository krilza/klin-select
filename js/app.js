// ============================================
// ДАННЫЕ
// ============================================
let products = [];
let cart = [];
let selectedSize = null;
let currentProductId = null;

// ============================================
// ХЕЛПЕР
// ============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text ?? '');
    return div.innerHTML;
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
// ИГРА 1: КЛИКЕР
// ============================================
const CLICKER_KEY = 'swaglink_clicker_score';
const CLICKER_REWARDS_KEY = 'swaglink_clicker_rewards';
let clickerScore = 0;
let clickerUnlocked = [];

function loadClicker() {
    clickerScore = parseInt(localStorage.getItem(CLICKER_KEY) || '0', 10);
    try {
        clickerUnlocked = JSON.parse(localStorage.getItem(CLICKER_REWARDS_KEY) || '[]');
    } catch { clickerUnlocked = []; }
}

function saveClicker() {
    localStorage.setItem(CLICKER_KEY, clickerScore.toString());
    localStorage.setItem(CLICKER_REWARDS_KEY, JSON.stringify(clickerUnlocked));
}

function renderClicker() {
    const scoreEl = document.getElementById('clicker-score');
    const progressText = document.getElementById('clicker-progress-text');
    const progressFill = document.getElementById('clicker-progress-fill');
    if (!scoreEl) return;

    scoreEl.textContent = clickerScore;

    // Ближайшая цель
    let nextTarget = 100;
    let prevTarget = 0;
    if (clickerScore >= 100) { nextTarget = 500; prevTarget = 100; }
    if (clickerScore >= 500) { nextTarget = 1000; prevTarget = 500; }
    if (clickerScore >= 1000) { nextTarget = 1000; prevTarget = 1000; }

    if (progressText) progressText.textContent = `${Math.min(clickerScore, nextTarget)} / ${nextTarget}`;

    const percent = nextTarget > prevTarget
        ? Math.min(100, ((clickerScore - prevTarget) / (nextTarget - prevTarget)) * 100)
        : 100;
    if (progressFill) progressFill.style.width = percent + '%';

    // Отметки призов
    [100, 500, 1000].forEach(threshold => {
        const el = document.getElementById('reward-' + threshold);
        if (!el) return;
        el.classList.remove('available', 'unlocked');
        if (clickerUnlocked.includes(threshold)) {
            el.classList.add('unlocked');
        } else if (clickerScore >= threshold) {
            el.classList.add('available');
        }
    });
}

function clickTheButton() {
    clickerScore += 1;

    // Небольшое увеличение за каждые 10 очков
    const scoreEl = document.getElementById('clicker-score');
    if (scoreEl) {
        scoreEl.classList.add('pop');
        setTimeout(() => scoreEl.classList.remove('pop'), 150);
    }

    // Проверка наград
    [100, 500, 1000].forEach(threshold => {
        if (clickerScore >= threshold && !clickerUnlocked.includes(threshold)) {
            clickerUnlocked.push(threshold);
            const reward = threshold === 100 ? '10%' : threshold === 500 ? '20%' : '30%';
            showToast(`🎉 Достижение! Промокод на скидку ${reward}`, 'success');
        }
    });

    saveClicker();
    renderClicker();
}

function copyPromo(code) {
    navigator.clipboard.writeText(code).then(() => {
        showToast(`Промокод ${code} скопирован!`, 'success');
    }).catch(() => {
        // Fallback
        const input = document.createElement('input');
        input.value = code;
        document.body.appendChild(input);
        input.select();
        try { document.execCommand('copy'); showToast(`Промокод ${code} скопирован!`, 'success'); } catch {}
        document.body.removeChild(input);
    });
}

function resetClicker() {
    if (!confirm('Сбросить прогресс в кликере?')) return;
    clickerScore = 0;
    clickerUnlocked = [];
    saveClicker();
    renderClicker();
    showToast('Прогресс кликера сброшен', 'info');
}

// ============================================
// ИГРА 2: УГАДАЙ БРЕНД
// ============================================
const QUIZ_QUESTIONS = [
    { q: "Худи под каким брендом носил Курт Кобейн?", a: "Fender", options: ["Nike", "Fender", "Adidas", "Puma"], correct: 1 },
    { q: "Какой бренд основал Трэвис Скотт?", a: "Cactus Jack", options: ["Yeezy", "Cactus Jack", "Off-White", "Supreme"], correct: 1 },
    { q: "Кто основал бренд Off-White?", a: "Вирджил Абло", options: ["Йоджи Ямамото", "Вирджил Абло", "Раф Симонс", "Канье Уэст"], correct: 1 },
    { q: "Supreme — это бренд из какого города?", a: "Нью-Йорк", options: ["Лондон", "Лос-Анджелес", "Нью-Йорк", "Токио"], correct: 2 },
    { q: "Какой бренд производит кроссовки Air Max?", a: "Nike", options: ["Adidas", "Puma", "Nike", "Reebok"], correct: 2 },
    { q: "Balenciaga — это бренд из какой страны?", a: "Испания", options: ["Италия", "Франция", "Испания", "Германия"], correct: 2 },
    { q: "Какой бренд носит слоган «Impossible is Nothing»?", a: "Adidas", options: ["Nike", "Adidas", "Puma", "Reebok"], correct: 1 },
    { q: "Yeezy — это коллаборация Adidas с кем?", a: "Канье Уэст", options: ["Трэвис Скотт", "Канье Уэст", "Дрейк", "Фаррелл"], correct: 1 },
    { q: "Какой бренд создал сумку Birkin?", a: "Hermès", options: ["Chanel", "Hermès", "Louis Vuitton", "Gucci"], correct: 1 },
    { q: "Какой бренд носил название Blue Ribbon Sports?", a: "Nike", options: ["Adidas", "Puma", "Nike", "New Balance"], correct: 2 }
];

let quizQuestions = [];
let quizCurrent = 0;
let quizScore = 0;

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function startQuiz() {
    quizQuestions = shuffleArray(QUIZ_QUESTIONS).slice(0, 10);
    quizCurrent = 0;
    quizScore = 0;

    document.getElementById('quiz-start').style.display = 'none';
    document.getElementById('quiz-result').style.display = 'none';
    document.getElementById('quiz-content').style.display = 'block';
    document.getElementById('quiz-total').textContent = quizQuestions.length;

    renderQuizQuestion();
}

function renderQuizQuestion() {
    const q = quizQuestions[quizCurrent];
    if (!q) return finishQuiz();

    document.getElementById('quiz-current').textContent = quizCurrent + 1;
    document.getElementById('quiz-score').textContent = quizScore;
    document.getElementById('quiz-question').textContent = q.q;

    const feedback = document.getElementById('quiz-feedback');
    feedback.textContent = '';
    feedback.classList.remove('show', 'success', 'error');

    const optionsEl = document.getElementById('quiz-options');
    optionsEl.innerHTML = q.options.map((opt, i) => `
        <button class="quiz-option" onclick="answerQuiz(${i})">${escapeHtml(opt)}</button>
    `).join('');
}

function answerQuiz(index) {
    const q = quizQuestions[quizCurrent];
    if (!q) return;

    const buttons = document.querySelectorAll('.quiz-option');
    const feedback = document.getElementById('quiz-feedback');

    buttons.forEach((btn, i) => {
        btn.classList.add('disabled');
        btn.disabled = true;
        if (i === q.correct) btn.classList.add('correct');
        if (i === index && i !== q.correct) btn.classList.add('wrong');
    });

    if (index === q.correct) {
        quizScore += 1;
        feedback.textContent = '✅ Правильно!';
        feedback.classList.add('show', 'success');
    } else {
        feedback.textContent = `❌ Неверно. Правильный ответ: ${q.a}`;
        feedback.classList.add('show', 'error');
    }

    document.getElementById('quiz-score').textContent = quizScore;

    setTimeout(() => {
        quizCurrent += 1;
        if (quizCurrent < quizQuestions.length) {
            renderQuizQuestion();
        } else {
            finishQuiz();
        }
    }, 1500);
}

function finishQuiz() {
    document.getElementById('quiz-content').style.display = 'none';
    const result = document.getElementById('quiz-result');
    result.style.display = 'block';

    const iconEl = document.getElementById('quiz-result-icon');
    const titleEl = document.getElementById('quiz-result-title');
    const textEl = document.getElementById('quiz-result-text');
    const codeBoxEl = document.getElementById('quiz-result-code');

    if (quizScore >= 8) {
        iconEl.textContent = '🏆';
        titleEl.textContent = 'Отличный результат!';
        textEl.textContent = `Ты ответил правильно на ${quizScore} из ${quizQuestions.length}. Держи промокод на скидку 15%!`;
        codeBoxEl.style.display = 'flex';
    } else if (quizScore >= 5) {
        iconEl.textContent = '👏';
        titleEl.textContent = 'Неплохо!';
        textEl.textContent = `Правильных ответов: ${quizScore} из ${quizQuestions.length}. До скидки нужно 8+. Попробуй ещё раз!`;
        codeBoxEl.style.display = 'none';
    } else {
        iconEl.textContent = '😅';
        titleEl.textContent = 'Есть куда расти!';
        textEl.textContent = `Правильных ответов: ${quizScore} из ${quizQuestions.length}. Попробуй ещё раз — будет интереснее!`;
        codeBoxEl.style.display = 'none';
    }
}

function restartQuiz() {
    startQuiz();
}

function copyQuizCode() {
    copyPromo('SWAG15');
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

    const name = nameEl ? nameEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const telegram = telegramEl ? telegramEl.value.trim() : '';
    const address = addressEl ? addressEl.value.trim() : '';
    const promo = promoEl ? promoEl.value.trim() : '';
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
${promo ? `🎁 Промокод: ${promo}` : ''}

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
    if (tabId === 'games') renderClicker();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// ЗАПУСК
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    loadData();
    loadClicker();
    renderProducts();
    renderCart();
    updateCartCount();
    renderClicker();

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

    // Кликер
    const clickerBtn = document.getElementById('clicker-btn');
    if (clickerBtn) {
        clickerBtn.addEventListener('click', clickTheButton);
    }

    // Клик по награде — копирование промокода
    document.querySelectorAll('.reward-item').forEach(el => {
        el.addEventListener('click', () => {
            if (el.classList.contains('unlocked') || el.classList.contains('available')) {
                const code = el.querySelector('.reward-code').textContent;
                copyPromo(code);
            }
        });
    });

    // Модалка
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