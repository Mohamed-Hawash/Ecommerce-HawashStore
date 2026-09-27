/* ==========================================================================
   Hawash Store - main.js
   Product tabs auto-rotate, cart, wishlist, auth (gated), dark mode,
   toast notifications, live search, back-to-top.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

    /* ----------------------------------------------------------------------
       0) TOASTS
    ---------------------------------------------------------------------- */
    const toastStack = document.getElementById('toastStack');

    function showToast(message, type) {
        if (!toastStack) return;
        const toast = document.createElement('div');
        toast.className = 'site-toast' + (type === 'error' ? ' toast-error' : '');
        const icon = type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check';
        toast.innerHTML = '<i class="fa-solid ' + icon + '"></i><span>' + message + '</span>';
        toastStack.appendChild(toast);

        requestAnimationFrame(function () {
            toast.classList.add('show');
        });

        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () {
                toast.remove();
            }, 350);
        }, 3000);
    }

    /* ----------------------------------------------------------------------
       1) PRODUCT TABS AUTO-ROTATE
    ---------------------------------------------------------------------- */
    const pages = document.querySelectorAll('#productTabContent .tab-pane');
    if (pages.length) {
        let currentIndex = 0;
        let rotateTimer = setInterval(rotate, 3500);

        function rotate() {
            pages[currentIndex].classList.remove('show', 'active');
            currentIndex = (currentIndex + 1) % pages.length;
            pages[currentIndex].classList.add('show', 'active');
        }

        const tabWrapper = document.getElementById('productTabContent');
        if (tabWrapper) {
            tabWrapper.addEventListener('mouseenter', function () { clearInterval(rotateTimer); });
            tabWrapper.addEventListener('mouseleave', function () { rotateTimer = setInterval(rotate, 3500); });
        }
    }

    /* ----------------------------------------------------------------------
       2) MINI CART
    ---------------------------------------------------------------------- */
    let mcCart = [];

    const mcToggleBtn = document.getElementById('mcToggleBtn');
    const mcCloseBtn = document.getElementById('mcCloseBtn');
    const mcShopMoreBtn = document.getElementById('mcShopMoreBtn');
    const mcOverlay = document.getElementById('mcOverlay');
    const mcPanel = document.getElementById('mcPanel');
    const mcItemsContainer = document.getElementById('mcItemsContainer');
    const mcEmptyState = document.getElementById('mcEmptyState');
    const mcCount = document.getElementById('mcCount');
    const mcBadge = document.getElementById('mcBadge');
    const mcSubtotal = document.getElementById('mcSubtotal');

    function mcOpenPanel() {
        mcPanel.classList.add('mc-open');
        mcOverlay.classList.add('mc-open');
    }
    function mcClosePanel() {
        mcPanel.classList.remove('mc-open');
        mcOverlay.classList.remove('mc-open');
    }

    if (mcToggleBtn) {
        mcToggleBtn.addEventListener('click', function (e) {
            e.preventDefault();
            mcOpenPanel();
        });
        mcCloseBtn.addEventListener('click', mcClosePanel);
        mcOverlay.addEventListener('click', mcClosePanel);
        mcShopMoreBtn.addEventListener('click', mcClosePanel);
    }

    function addToCart(id, name, price, imageUrl) {
        const existing = mcCart.find(item => item.id === id);
        if (existing) {
            existing.qty += 1;
        } else {
            mcCart.push({ id, name, price, qty: 1, imageUrl });
        }
        mcRender();
        mcOpenPanel();
        showToast('اتضاف "' + name + '" للسلة بنجاح');
    }

    window.mcChangeQty = function (id, delta) {
        const item = mcCart.find(i => i.id === id);
        if (!item) return;
        item.qty += delta;
        if (item.qty <= 0) {
            mcCart = mcCart.filter(i => i.id !== id);
        }
        mcRender();
    };

    window.mcRemoveItem = function (id) {
        mcCart = mcCart.filter(i => i.id !== id);
        mcRender();
    };

    function mcRender() {
        const totalItems = mcCart.reduce((sum, i) => sum + i.qty, 0);
        const subtotal = mcCart.reduce((sum, i) => sum + i.qty * i.price, 0);

        mcCount.textContent = totalItems;
        mcBadge.textContent = totalItems;
        mcBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        mcSubtotal.textContent = subtotal;

        if (mcCart.length === 0) {
            mcItemsContainer.innerHTML = '';
            mcItemsContainer.appendChild(mcEmptyState);
            return;
        }

        mcItemsContainer.innerHTML = mcCart.map(item => `
                <div class="mc-item">
                    <img class="mc-item-thumb" src="${item.imageUrl}" alt="${item.name}">
                    <div class="mc-item-info">
                        <h4>${item.name}</h4>
                        <div class="mc-item-price">$${item.price}</div>
                        <div class="mc-qty-control">
                            <button onclick="mcChangeQty('${item.id}', -1)">-</button>
                            <span>${item.qty}</span>
                            <button onclick="mcChangeQty('${item.id}', 1)">+</button>
                        </div>
                    </div>
                    <button class="mc-remove-btn" onclick="mcRemoveItem('${item.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                            <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                        </svg>
                    </button>
                </div>
            `).join('');
    }

    document.querySelectorAll('.btn-add-cart').forEach(function (btn, index) {
        btn.addEventListener('click', function () {
            const card = btn.closest('.product-card');
            if (!card) return;

            const name = card.querySelector('.product-title a').textContent.trim();
            const priceText = card.querySelector('.price-box .current-price').textContent.trim();
            const price = parseFloat(priceText.replace('$', ''));
            const imageUrl = card.querySelector('.product-img img').getAttribute('src');
            const id = 'product-' + index;

            addToCart(id, name, price, imageUrl);
        });
    });

    /* ----------------------------------------------------------------------
       3) FAVORITES / WISHLIST
    ---------------------------------------------------------------------- */
    let fpFavorites = [];

    const fpToggleBtn = document.getElementById('fpToggleBtn');
    const fpCloseBtn = document.getElementById('fpCloseBtn');
    const fpOverlay = document.getElementById('fpOverlay');
    const fpPanel = document.getElementById('fpPanel');
    const fpItemsContainer = document.getElementById('fpItemsContainer');
    const fpEmptyState = document.getElementById('fpEmptyState');
    const fpCount = document.getElementById('fpCount');
    const fpBadge = document.getElementById('fpBadge');

    function fpOpenPanel() {
        fpPanel.classList.add('fp-open');
        fpOverlay.classList.add('fp-open');
    }
    function fpClosePanel() {
        fpPanel.classList.remove('fp-open');
        fpOverlay.classList.remove('fp-open');
    }

    if (fpToggleBtn) {
        fpToggleBtn.addEventListener('click', function (e) {
            e.preventDefault();
            fpOpenPanel();
        });
        fpCloseBtn.addEventListener('click', fpClosePanel);
        fpOverlay.addEventListener('click', fpClosePanel);
    }

    function fpToggleFavorite(id, name, price, imageUrl, btnEl) {
        const existingIndex = fpFavorites.findIndex(item => item.id === id);

        if (existingIndex > -1) {
            fpFavorites.splice(existingIndex, 1);
            if (btnEl) {
                btnEl.classList.remove('fp-active');
                btnEl.querySelector('i').classList.remove('fa-solid');
                btnEl.querySelector('i').classList.add('fa-regular');
            }
            showToast('اتشال "' + name + '" من المفضلة');
        } else {
            fpFavorites.push({ id, name, price, imageUrl });
            if (btnEl) {
                btnEl.classList.add('fp-active');
                btnEl.querySelector('i').classList.remove('fa-regular');
                btnEl.querySelector('i').classList.add('fa-solid');
            }
            showToast('اتضاف "' + name + '" للمفضلة');
        }
        fpRender();
    }

    window.fpRemoveFavorite = function (id) {
        fpFavorites = fpFavorites.filter(i => i.id !== id);

        document.querySelectorAll('.btn-wishlist').forEach(function (btn) {
            const card = btn.closest('.product-card');
            if (!card) return;
            const cardId = 'product-' + Array.from(document.querySelectorAll('.product-card')).indexOf(card);
            if (cardId === id) {
                btn.classList.remove('fp-active');
                btn.querySelector('i').classList.remove('fa-solid');
                btn.querySelector('i').classList.add('fa-regular');
            }
        });

        fpRender();
    };

    function fpRender() {
        const totalItems = fpFavorites.length;
        fpCount.textContent = totalItems;
        fpBadge.textContent = totalItems;
        fpBadge.style.display = totalItems > 0 ? 'flex' : 'none';

        if (fpFavorites.length === 0) {
            fpItemsContainer.innerHTML = '';
            fpItemsContainer.appendChild(fpEmptyState);
            return;
        }

        fpItemsContainer.innerHTML = fpFavorites.map(item => `
                <div class="fp-item">
                    <img class="fp-item-thumb" src="${item.imageUrl}" alt="${item.name}">
                    <div class="fp-item-info">
                        <h4>${item.name}</h4>
                        <div class="fp-item-price">$${item.price}</div>
                    </div>
                    <button class="fp-remove-btn" onclick="fpRemoveFavorite('${item.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                            <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                        </svg>
                    </button>
                </div>
            `).join('');
    }

    document.querySelectorAll('.btn-wishlist').forEach(function (btn, index) {
        btn.addEventListener('click', function () {
            const card = btn.closest('.product-card');
            if (!card) return;

            const name = card.querySelector('.product-title a').textContent.trim();
            const priceText = card.querySelector('.price-box .current-price').textContent.trim();
            const price = parseFloat(priceText.replace('$', ''));
            const imageUrl = card.querySelector('.product-img img').getAttribute('src');
            const id = 'product-' + index;

            fpToggleFavorite(id, name, price, imageUrl, btn);
        });
    });

    /* ----------------------------------------------------------------------
       4) AUTHENTICATION + FORCED "AUTH GATE"
       The site cannot be browsed until the visitor creates an account or
       logs in. Everything behind the gate is blurred & unclickable.
    ---------------------------------------------------------------------- */
    const loginOverlay = document.getElementById('loginOverlay');
    const signupOverlay = document.getElementById('signupOverlay');
    const loginOpenBtn = document.getElementById('loginOpenBtn');
    const signupOpenBtn = document.getElementById('signupOpenBtn');
    const switchToSignup = document.getElementById('switchToSignup');
    const switchToLogin = document.getElementById('switchToLogin');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    function openLogin() { loginOverlay.classList.add('auth-open'); signupOverlay.classList.remove('auth-open'); }
    function closeLogin() { loginOverlay.classList.remove('auth-open'); }
    function openSignup() { signupOverlay.classList.add('auth-open'); loginOverlay.classList.remove('auth-open'); }
    function closeSignup() { signupOverlay.classList.remove('auth-open'); }

    if (loginOpenBtn) loginOpenBtn.addEventListener('click', openLogin);
    if (signupOpenBtn) signupOpenBtn.addEventListener('click', openSignup);
    if (switchToSignup) switchToSignup.addEventListener('click', openSignup);
    if (switchToLogin) switchToLogin.addEventListener('click', openLogin);

    const authButtonsArea = document.getElementById('authButtonsArea');
    const authUserArea = document.getElementById('authUserArea');
    const authUserName = document.getElementById('authUserName');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginError = document.getElementById('loginError');
    const signupError = document.getElementById('signupError');

    function getUsers() {
        return JSON.parse(localStorage.getItem('siteUsers') || '[]');
    }
    function saveUsers(users) {
        localStorage.setItem('siteUsers', JSON.stringify(users));
    }
    function getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser') || 'null');
    }
    function setCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }
    function clearCurrentUser() {
        localStorage.removeItem('currentUser');
    }

    function updateAuthUI() {
        const user = getCurrentUser();
        if (user) {
            authButtonsArea.classList.add('d-none');
            authUserArea.classList.remove('d-none');
            authUserArea.classList.add('d-flex');
            authUserName.textContent = 'Hi, ' + user.name;
        } else {
            authButtonsArea.classList.remove('d-none');
            authUserArea.classList.add('d-none');
            authUserArea.classList.remove('d-flex');
        }
    }

    function lockSite() {
        document.body.classList.add('auth-locked');
        openLogin();
    }

    function unlockSite() {
        document.body.classList.remove('auth-locked');
        closeLogin();
        closeSignup();
    }

    signupForm.addEventListener('submit', function (e) {
        e.preventDefault();
        signupError.textContent = '';

        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim().toLowerCase();
        const password = document.getElementById('signupPassword').value;

        const users = getUsers();
        if (users.find(u => u.email === email)) {
            signupError.textContent = 'An account with this email already exists.';
            return;
        }

        users.push({ name, email, password });
        saveUsers(users);
        setCurrentUser({ name, email });
        updateAuthUI();
        signupForm.reset();
        unlockSite();
        showToast('أهلاً بيك يا ' + name + '! اتعمل حسابك بنجاح 🎉');
    });

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        loginError.textContent = '';

        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;

        const users = getUsers();
        const found = users.find(u => u.email === email && u.password === password);

        if (!found) {
            loginError.textContent = 'Incorrect email or password.';
            return;
        }

        setCurrentUser({ name: found.name, email: found.email });
        updateAuthUI();
        loginForm.reset();
        unlockSite();
        showToast('أهلاً بعودتك يا ' + found.name + '! 👋');
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            clearCurrentUser();
            updateAuthUI();
            showToast('تم تسجيل الخروج بنجاح');
            lockSite();
        });
    }

    updateAuthUI();
    if (!getCurrentUser()) {
        lockSite();
    } else {
        unlockSite();
    }

    /* ----------------------------------------------------------------------
       5) DARK / LIGHT MODE TOGGLE
    ---------------------------------------------------------------------- */
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function () {
            const isDark = document.documentElement.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    /* ----------------------------------------------------------------------
       6) LIVE PRODUCT SEARCH
    ---------------------------------------------------------------------- */
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    function runSearch() {
        if (!searchInput) return;
        const query = searchInput.value.trim().toLowerCase();
        const cards = document.querySelectorAll('.product-card');

        cards.forEach(function (card) {
            const titleEl = card.querySelector('.product-title a');
            const title = titleEl ? titleEl.textContent.toLowerCase() : '';
            const col = card.closest('[class*="col-"]') || card;
            const matches = query === '' || title.includes(query);
            col.style.display = matches ? '' : 'none';
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', runSearch);
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                runSearch();
            }
        });
    }
    if (searchBtn) {
        searchBtn.addEventListener('click', runSearch);
    }

    /* ----------------------------------------------------------------------
       7) BACK TO TOP
    ---------------------------------------------------------------------- */
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 400) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        backToTopBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

});


