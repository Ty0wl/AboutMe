// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let gamesData = [];
let reviewsData = {};
let currentSort = 'id';
let sortDirection = {};
let toastTimeout;

// ===== ГЛОБАЛЬНЫЕ НАСТРОЙКИ =====
const settings = {
    defaultLang: 'ru',
    storageKey: 'site_language',
    currentPage: 'index'
};

// Пути к иконкам рейтингов (НАСТРОЙ ЭТИ ПУТИ ПОД СВОЙ РЕПОЗИТОРИЙ)
const RATING_ICONS = {
    star: {
        empty: 'resources/gfx/ui/rating/star_empty.png',
        filled: 'resources/gfx/ui/rating/star_filled.png'
    },
    skull: {
        empty: 'resources/gfx/ui/rating/skull_empty.png',
        filled: 'resources/gfx/ui/rating/skull_filled.png'
    }
};

function detectCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('changelog.html')) return 'changelog';
    if (path.includes('games.html')) return 'games';
    if (path.includes('index.html') || path === '/' || path.endsWith('/')) return 'index';
    return 'index';
}

// ===== ИНИЦИАЛИЗАЦИЯ (ОДИН ВЫЗОВ) =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Инициализация сайта...');
    try {
        await loadReviews();
        await loadGames();
        setupSortButtons();
        setupModalEvents();
        setupGradeClicks();
        initSettings();
        setupContentProtection();
        
        setTimeout(() => {
            setupLegendParticles();
        }, 100);
    } catch (err) {
        console.error('Ошибка инициализации:', err);
    }
});

// ===== ЗАГРУЗКА ДАННЫХ =====
async function loadReviews() {
    try {
        const res = await fetch('reviews.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        reviewsData = await res.json();
        console.log('reviews.json загружен:', Object.keys(reviewsData));
    } catch (err) {
        console.error('Ошибка reviews.json:', err);
        reviewsData = {};
    }
}

async function loadGames() {
    try {
        const response = await fetch('games.json');
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        gamesData = await response.json();
        renderTable();
        console.log('games.json загружен');
    } catch (error) {
        console.error('Ошибка games.json:', error);
        const tbody = document.getElementById('games-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="color: #F04F78; text-align: center; padding: 20px;">Ошибка загрузки данных</td></tr>';
        }
    }
}

// ===== ОТРИСОВКА ТАБЛИЦЫ =====
function renderTable() {
    const tbody = document.getElementById('games-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    gamesData.forEach(game => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <img src="${game.cover}" 
                     alt="${game.name}" 
                     class="game-cover" 
                     loading="lazy">
            </td>
            <td>${game.year}</td>
            <td>${game.type}</td>
            <td>${game.genre}</td>
            <td>${game.name}</td>
            <td>
                <span class="grade-badge grade-${game.grade.toLowerCase().replace('+', '-plus')} ${game.review === '1' ? 'has-review' : ''}" 
                data-id="${game.id}" 
                data-review="${game.review}">
                ${game.grade}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ===== КЛИКИ ПО ОЦЕНКАМ =====
function setupGradeClicks() {
    const badges = document.querySelectorAll('#games-table-body .grade-badge');
    
    badges.forEach(badge => {
        const hasReview = badge.getAttribute('data-review') === '1';
        
        if (hasReview) {
            badge.classList.add('has-review');
            badge.style.cursor = 'pointer';
            badge.setAttribute('aria-label', `Открыть рецензию: ${badge.textContent}`);
            badge.setAttribute('tabindex', '0');
            
            badge.addEventListener('click', function(e) {
                e.stopPropagation();
                openReviewModal(this.getAttribute('data-id'));
            });
            
            badge.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openReviewModal(badge.getAttribute('data-id'));
                }
            });
            
        } else {
            badge.style.cursor = 'default';
            badge.addEventListener('click', function(e) {
                e.stopPropagation();
                showReviewToast();
            });
        }
    });
}

// ===== ЧАСТИЦЫ ДЛЯ ЛЕГЕНДЫ =====
function setupLegendParticles() {
    console.log('setupLegendParticles: запуск');
    const badges = document.querySelectorAll('.legend-box .grade-badge');

    const gradeParticleMap = {
        'grade-a': 'resources/gfx/particles/particle_a.png',
        'grade-b': 'resources/gfx/particles/particle_b.png',
        'grade-c': 'resources/gfx/particles/particle_c.png',
        'grade-d': 'resources/gfx/particles/particle_d.png',
        'grade-e': 'resources/gfx/particles/particle_e.png',
        'grade-f': 'resources/gfx/particles/particle_f.png',
    };

    badges.forEach(badge => {
        badge.style.cursor = 'pointer';
        badge.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = badge.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            let particlePath = 'resources/gfx/particles/particle_a.png';
            for (const [cls, path] of Object.entries(gradeParticleMap)) {
                if (badge.classList.contains(cls)) {
                    particlePath = path;
                    break;
                }
            }
            
            spawnParticles(x, y, particlePath);
        });
    });
}

function spawnParticles(originX, originY, imagePath) {
    const count = 25;
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('img');
        particle.src = `${imagePath}?t=${Date.now()}-${i}`;
        particle.alt = '';
        
        particle.style.position = 'fixed';
        particle.style.left = originX + 'px';
        particle.style.top = originY + 'px';
        particle.style.width = '18px';
        particle.style.height = '18px';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '999999';
        particle.style.opacity = '1';
        particle.style.transform = 'translate(-50%, -50%) scale(1)';
        particle.style.imageRendering = 'pixelated';
        
        document.body.appendChild(particle);
        
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const distance = 70 + Math.random() * 60;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance - 30;
        
        particle.offsetHeight;
        
        particle.style.transition = 'all 0.75s cubic-bezier(0.2, 0.8, 0.2, 1)';
        particle.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0.1)`;
        particle.style.opacity = '0';
        
        setTimeout(() => { if (particle.parentNode) particle.remove(); }, 800);
    }
}

// ===== МОДАЛЬНОЕ ОКНО И ТОАСТ =====

// Генерация HTML для иконок рейтинга
function renderRatingIcons(value, type = 'star', max = 5) {
    const icons = RATING_ICONS[type];
    let html = '<div class="rating-icons">';
    for (let i = 1; i <= max; i++) {
        const src = i <= value ? icons.filled : icons.empty;
        html += `<img src="${src}" alt="${i <= value ? 'filled' : 'empty'}" class="rating-icon" loading="lazy">`;
    }
    html += '</div>';
    return html;
}

// Рендер блока оценок и описаний (Блок 4)
function renderReviewStats(container, data) {
    if (!data.ratings && !data.meta) return;
    
    let html = '<div class="review-stats">';
    
    // === 1. Основные категории (Геймплей, Сюжет, Музыка, Сложность) ===
    const categories = [
        { key: 'gameplay', label: 'Геймплей', type: 'star' },
        { key: 'story', label: 'Сюжет', type: 'star' },
        { key: 'music', label: 'Музыка', type: 'star' },
        { key: 'difficulty', label: 'Сложность', type: 'skull' }
    ];

    categories.forEach(cat => {
        const val = data.ratings?.[cat.key] ?? 0;
        const desc = data.descriptions?.[cat.key] || '';
        
        html += `<div class="stat-item">`;
        html += `<div class="stat-header">`;
        html += `<span class="stat-label">${cat.label}</span>`;
        html += renderRatingIcons(val, cat.type);
        html += `</div>`;
        
        if (desc) {
            html += `<div class="stat-desc">${desc}</div>`;
        }
        html += `</div>`;
    });
    
    html += '</div>'; // Закрываем .review-stats
    
    // === 2. Технические параметры (Оптимизация, Время) — БЕЗ разделителя ===
    if (data.meta) {
        html += '<div class="review-meta">';
        
        if (data.meta.optimization) {
            html += `<div class="meta-item">Оптимизация: <span class="meta-value">${data.meta.optimization}</span></div>`;
        }
        if (data.meta.duration) {
            html += `<div class="meta-item">Продолжительность: <span class="meta-value">${data.meta.duration}</span></div>`;
        }
        
        html += '</div>';
    }
    
    container.insertAdjacentHTML('beforeend', html);
}

async function openReviewModal(gameId) {
    console.log(`Открытие рецензии для gameId: ${gameId}`);
    
    const modal = document.getElementById('review-modal');
    const currentLang = localStorage.getItem(settings.storageKey) || 'ru';
    
    const translatedReview = await getReviewTranslation(gameId, currentLang);
    const review = reviewsData[String(gameId)];
    
    const reviewData = {
        ...review,
        ...translatedReview
    };
    
    if (reviewData) {
        // 1. Заголовок + Иконка
        document.getElementById('modal-title').innerHTML = `
            <div class="review-header">
                <span>${reviewData.title || `Game #${gameId}`}</span>
            </div>
        `;
        
        // 2. Цитата
        const quoteText = reviewData.quote ? `"${reviewData.quote}"` : '';
        document.getElementById('modal-quote').textContent = quoteText;
        document.getElementById('modal-quote').style.display = reviewData.quote ? 'block' : 'none';
        
        // 3. Скриншоты
        const screenshotsContainer = document.getElementById('modal-screenshots');
        if (screenshotsContainer && reviewData.screenshots && reviewData.screenshots.length > 0) {
            renderScreenshots(reviewData.screenshots, screenshotsContainer);
            screenshotsContainer.style.display = 'flex';
        } else if (screenshotsContainer) {
            screenshotsContainer.style.display = 'none';
        }
        
        // 4. Оценки и описания
        const statsContainer = document.getElementById('review-stats');
        statsContainer.innerHTML = ''; // Очистка
        renderReviewStats(statsContainer, reviewData);
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeReviewModal() {
    document.getElementById('review-modal').classList.remove('active');
    document.body.style.overflow = '';
}

function showReviewToast() {
    const toast = document.getElementById('review-toast');
    toast.classList.add('active');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('active'), 5000);
}

function closeReviewToast() {
    document.getElementById('review-toast').classList.remove('active');
    clearTimeout(toastTimeout);
}

function setupModalEvents() {
    document.getElementById('modal-close')?.addEventListener('click', closeReviewModal);
    document.getElementById('toast-close')?.addEventListener('click', closeReviewToast);
    
    const modal = document.getElementById('review-modal');
    if (modal) {
        modal.addEventListener('click', (e) => { if (e.target === modal) closeReviewModal(); });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeReviewModal(); closeReviewToast(); }
    });
}

// ===== СОРТИРОВКА =====
function setupSortButtons() {
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const field = this.getAttribute('data-sort');
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            sortGames(field);
        });
    });
    document.querySelector('[data-sort="id"]')?.classList.add('active');
}

function sortGames(field) {
    sortDirection[field] = sortDirection[field] === 'asc' ? 'desc' : 'asc';
    gamesData.sort((a, b) => {
        let valA = a[field], valB = b[field];
        if (typeof valA === 'number') return sortDirection[field] === 'asc' ? valA - valB : valB - valA;
        return sortDirection[field] === 'asc' ? String(valA).localeCompare(valB, 'ru') : String(valB).localeCompare(valA, 'ru');
    });
    renderTable();
    setupGradeClicks();
}

/// ===== СИСТЕМА ПЕРЕВОДОВ =====
async function setLanguage(langCode) {
    console.log(`Загрузка языка: ${langCode}`);
    localStorage.setItem(settings.storageKey, langCode);

    const selector = document.getElementById('language-selector');
    if (selector) selector.value = langCode;

    try {
        const page = settings.currentPage || detectCurrentPage();
        const path = `resources/translations/${page}/${langCode}.json`;
        console.log(`Загружаю перевод страницы: ${path}`);

        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            el.classList.add('i18n-loading');
            el.classList.remove('i18n-loaded');
        });

        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP ${response.status}: Файл не найден`);

        const dictionary = await response.json();
        console.log('JSON успешно загружен');

        if (dictionary.page_title) {
            document.title = dictionary.page_title;
        }

        let replacedCount = 0;
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (dictionary[key]) {
                element.innerHTML = dictionary[key];
                element.classList.remove('i18n-loading');
                element.classList.add('i18n-loaded');
                replacedCount++;
            }
        });

        console.log(`Переведено элементов: ${replacedCount}`);

    } catch (error) {
        console.error(`Ошибка загрузки языка ${langCode}:`, error);
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.classList.remove('i18n-loading');
            el.classList.add('i18n-loaded');
        });
        if (langCode !== 'ru') setLanguage('ru');
    }
}

async function getReviewTranslation(gameId, langCode) {
    try {
        const path = `resources/translations/reviews/${langCode}.json`;
        const response = await fetch(path);
        if (!response.ok) return null;
        
        const reviews = await response.json();
        return reviews[String(gameId)] || null;
    } catch (error) {
        console.error(`Ошибка загрузки перевода рецензии ${gameId}:`, error);
        return null;
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ НАСТРОЕК =====
function initSettings() {
    settings.currentPage = detectCurrentPage();
    console.log(`Текущая страница: ${settings.currentPage}`);
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.classList.add('i18n-loading');
    });

    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const overlay = document.getElementById('settings-overlay');
    const closeBtn = document.getElementById('settings-close');
    const langSelector = document.getElementById('language-selector');

    if (settingsBtn) {
        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            settingsPanel.classList.add('active');
            overlay.classList.add('active');
        });
    }
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (overlay) overlay.addEventListener('click', closePanel);

    function closePanel() {
        settingsPanel.classList.remove('active');
        overlay.classList.remove('active');
    }

    if (langSelector) {
        langSelector.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }

    const savedLang = localStorage.getItem(settings.storageKey) || settings.defaultLang;
    setLanguage(savedLang);
}

// ===== ЗАЩИТА ОТ КОПИРОВАНИЯ И ПРАВОГО КЛИКА =====
function setupContentProtection() {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('selectstart', (e) => e.preventDefault());
    document.addEventListener('copy', (e) => e.preventDefault());
    document.addEventListener('cut', (e) => e.preventDefault());

    document.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });
    
    document.querySelectorAll('img').forEach(img => {
        img.setAttribute('draggable', 'false');
    });
    
    console.log('Защита контента активирована');
}

function renderScreenshots(screenshots, container) {
    console.log(`Отрисовка ${screenshots.length} скриншотов`);
    container.innerHTML = '';
    
    if (screenshots.length === 0) {
        container.innerHTML = '<div class="screenshots-loading">Скриншоты не найдены</div>';
        container.style.display = 'block';
        return;
    }
    
    screenshots.forEach((screenshotUrl, index) => {
        const img = document.createElement('img');
        img.src = screenshotUrl;
        img.alt = `Screenshot ${index + 1}`;
        img.className = 'screenshot-item';
        img.loading = 'lazy';
        img.draggable = false; // 🔥 Запрещаем перетаскивание
        
        img.addEventListener('click', () => {
            window.open(screenshotUrl, '_blank');
        });
        
        img.onload = () => console.log(`Загружен скриншот #${index + 1}`);
        img.onerror = () => console.error(`Ошибка загрузки: ${screenshotUrl}`);
        
        container.appendChild(img);
    });
    
    container.style.display = 'flex';
    
    setTimeout(() => {
        initCustomScrollbar();
    }, 150);
}

// ===== КАСТОМНЫЙ СКРОЛЛБАР + ПЛАВНАЯ ПРОКРУТКА КОЛЁСИКОМ =====
function initCustomScrollbar() {
    const container = document.getElementById('modal-screenshots');
    const scrollArea = document.querySelector('.screenshots-scroll-area');
    const scrollbar = document.querySelector('.custom-scrollbar');
    const thumb = document.querySelector('.custom-scrollbar-thumb');
    
    if (!container || !scrollArea || !scrollbar || !thumb) return;
    if (scrollArea.dataset.scrollInit === 'true') return;
    scrollArea.dataset.scrollInit = 'true';

    let isDragging = false;
    let thumbRaf = null;
    let scrollTarget = 0;
    let scrollCurrent = 0;
    let scrollRaf = null;

    // Плавная прокрутка
    function smoothScrollLoop() {
        scrollCurrent += (scrollTarget - scrollCurrent) * 0.12;
        container.scrollLeft = scrollCurrent;
        updateThumbPosition();
        
        if (Math.abs(scrollTarget - scrollCurrent) > 0.5) {
            scrollRaf = requestAnimationFrame(smoothScrollLoop);
        } else {
            scrollRaf = null;
            scrollCurrent = scrollTarget;
        }
    }

    // Обновление ползунка
    function updateThumbPosition() {
        if (thumbRaf) return;
        
        thumbRaf = requestAnimationFrame(() => {
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;
            const scrollLeft = container.scrollLeft;
            
            if (scrollWidth <= clientWidth) {
                scrollbar.style.opacity = '0';
                scrollbar.style.pointerEvents = 'none';
                thumbRaf = null;
                return;
            }
            
            scrollbar.style.opacity = '1';
            scrollbar.style.pointerEvents = 'auto';
            
            const thumbWidth = Math.max(40, (clientWidth / scrollWidth) * clientWidth);
            thumb.style.width = thumbWidth + 'px';
            
            const maxScroll = scrollWidth - clientWidth;
            const percent = maxScroll > 0 ? scrollLeft / maxScroll : 0;
            const availableTrack = clientWidth - thumbWidth;
            
            const clampedLeft = Math.max(0, Math.min(availableTrack, percent * availableTrack));
            thumb.style.left = clampedLeft + 'px';
            
            thumbRaf = null;
        });
    }

    // Обработчики
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        scrollTarget += e.deltaY * 0.8;
        scrollTarget = Math.max(0, Math.min(scrollTarget, container.scrollWidth - container.clientWidth));
        
        if (!scrollRaf) {
            scrollCurrent = container.scrollLeft;
            scrollRaf = requestAnimationFrame(smoothScrollLoop);
        }
    }, { passive: false });

    container.addEventListener('scroll', updateThumbPosition, { passive: true });

    const onDragStart = (e) => {
        isDragging = true;
        document.body.style.cursor = 'grabbing';
        e.preventDefault();
        if (scrollRaf) {
            cancelAnimationFrame(scrollRaf);
            scrollRaf = null;
        }
    };

    const onDragMove = (e) => {
        if (!isDragging) return;
        const rect = scrollbar.getBoundingClientRect();
        let mouseX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percent = mouseX / rect.width;
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        scrollTarget = percent * maxScroll;
        scrollCurrent = scrollTarget;
        container.scrollLeft = scrollCurrent;
        updateThumbPosition();
    };

    const onDragEnd = () => {
        if (isDragging) {
            isDragging = false;
            document.body.style.cursor = '';
        }
    };

    const onTrackClick = (e) => {
        if (e.target === thumb) return;
        const rect = scrollbar.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const percent = mouseX / rect.width;
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        scrollTarget = percent * maxScroll;
        scrollCurrent = container.scrollLeft;
        if (!scrollRaf) scrollRaf = requestAnimationFrame(smoothScrollLoop);
    };

    thumb.addEventListener('mousedown', onDragStart, { passive: false });
    document.addEventListener('mousemove', onDragMove, { passive: true });
    document.addEventListener('mouseup', onDragEnd, { passive: true });
    scrollbar.addEventListener('click', onTrackClick, { passive: true });

    updateThumbPosition();
}