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
                <span class="grade-badge grade-${game.grade.toLowerCase().replace('+', '-plus')}" 
                      data-id="${game.id}" 
                      data-review="${game.review}">
                    ${game.grade}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ===== КЛИКИ ПО ОЦЕНКАМ В ТАБЛИЦЕ =====
function setupGradeClicks() {
    const badges = document.querySelectorAll('#games-table-body .grade-badge');
    badges.forEach(badge => {
        badge.style.cursor = 'pointer';
        badge.addEventListener('click', function() {
            const gameId = this.getAttribute('data-id');
            const hasReview = this.getAttribute('data-review') === '1';

            if (hasReview) {
                openReviewModal(gameId);
            } else {
                showReviewToast();
            }
        });
    });
}

// ===== ЧАСТИЦЫ ДЛЯ ЛЕГЕНДЫ =====
function setupLegendParticles() {
    console.log('setupLegendParticles: запуск');
    const badges = document.querySelectorAll('.legend-box .grade-badge');

    const gradeParticleMap = {
        'grade-a': 'resources/gfx/particles/particle_a.png',
        'grade-b':      'resources/gfx/particles/particle_b.png',
        'grade-c':      'resources/gfx/particles/particle_c.png',
        'grade-d':      'resources/gfx/particles/particle_d.png',
        'grade-e':      'resources/gfx/particles/particle_e.png',
        'grade-f':      'resources/gfx/particles/particle_f.png',
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
    
    console.log('reviewData:', reviewData);
    console.log('screenshots:', reviewData?.screenshots);
    
    if (reviewData) {
        document.getElementById('modal-title').textContent = reviewData.title || `Game #${gameId}`;
        
        const screenshotsContainer = document.getElementById('modal-screenshots');
        console.log('Контейнер:', screenshotsContainer);
        console.log('screenshots.length:', reviewData?.screenshots?.length);
        
        if (screenshotsContainer && reviewData.screenshots && reviewData.screenshots.length > 0) {
            console.log('Показываем скриншоты');
            renderScreenshots(reviewData.screenshots, screenshotsContainer);
        } else if (screenshotsContainer) {
            console.log('Скрываем контейнер (нет скриншотов)');
            screenshotsContainer.style.display = 'none';
        }
        
        document.getElementById('modal-text').textContent = reviewData.text || 'Review text not available.';
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

// ===== ПЕРЕВОД РЕЦЕНЗИЙ =====
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
    document.querySelectorAll('img').forEach(img => {
        img.setAttribute('draggable', 'false');
        img.addEventListener('dragstart', (e) => e.preventDefault());
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

// ===== КАСТОМНЫЙ СКРОЛЛБАР =====

function initCustomScrollbar() {
    const container = document.getElementById('modal-screenshots');
    const scrollbar = document.querySelector('.custom-scrollbar');
    const thumb = document.querySelector('.custom-scrollbar-thumb');
    
    // Проверка наличия элементов
    if (!container || !scrollbar || !thumb) {
        console.warn('Элементы скроллбара не найдены');
        return;
    }
    
    let isDragging = false;
    let animationFrame = null;

    // Плавное обновление позиции ползунка (через requestAnimationFrame)
    function updateThumbPosition() {
        if (animationFrame) return;
        
        animationFrame = requestAnimationFrame(() => {
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;
            const scrollLeft = container.scrollLeft;
            
            // Скрываем ползунок, если прокрутка не нужна
            if (scrollWidth <= clientWidth) {
                scrollbar.style.opacity = '0';
                scrollbar.style.pointerEvents = 'none';
                animationFrame = null;
                return;
            }
            
            scrollbar.style.opacity = '1';
            scrollbar.style.pointerEvents = 'auto';
            
            // Ширина ползунка пропорциональна видимой области
            const thumbWidth = Math.max(50, (clientWidth / scrollWidth) * clientWidth);
            thumb.style.width = thumbWidth + 'px';
            
            // Позиция ползунка
            const maxScroll = scrollWidth - clientWidth;
            const percent = maxScroll > 0 ? scrollLeft / maxScroll : 0;
            const availableTrack = clientWidth - thumbWidth;
            
            thumb.style.left = (percent * availableTrack) + 'px';
            animationFrame = null;
        });
    }

    // Начало перетаскивания
    const onDragStart = (e) => {
        isDragging = true;
        document.body.style.cursor = 'grabbing';
        e.preventDefault();
        e.stopPropagation();
    };

    // Движение мыши
    const onDragMove = (e) => {
        if (!isDragging) return;
        
        const rect = scrollbar.getBoundingClientRect();
        let mouseX = e.clientX - rect.left;
        
        // Ограничиваем в пределах трека
        mouseX = Math.max(0, Math.min(mouseX, rect.width));
        
        const percent = mouseX / rect.width;
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        container.scrollLeft = percent * maxScroll;
        updateThumbPosition();
    };

    // Конец перетаскивания
    const onDragEnd = () => {
        if (isDragging) {
            isDragging = false;
            document.body.style.cursor = '';
        }
    };

    // Клик по треку (быстрый переход)
    const onTrackClick = (e) => {
        if (e.target === thumb) return;
        
        const rect = scrollbar.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const percent = mouseX / rect.width;
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        container.scrollTo({
            left: percent * maxScroll,
            behavior: 'smooth'
        });
    };

    // Прокрутка колёсиком
    const onWheel = (e) => {
        e.preventDefault();
        container.scrollLeft += e.deltaY * 1.5;
        updateThumbPosition();
    };
    
    // Навешиваем обработчики
    thumb.addEventListener('mousedown', onDragStart, { passive: false });
    document.addEventListener('mousemove', onDragMove, { passive: true });
    document.addEventListener('mouseup', onDragEnd, { passive: true });
    scrollbar.addEventListener('click', onTrackClick, { passive: true });
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('scroll', updateThumbPosition, { passive: true });

    // Инициализация
    updateThumbPosition();

    return () => {
        thumb.removeEventListener('mousedown', onDragStart);
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        scrollbar.removeEventListener('click', onTrackClick);
        container.removeEventListener('wheel', onWheel);
        container.removeEventListener('scroll', updateThumbPosition);
        if (animationFrame) cancelAnimationFrame(animationFrame);
    };
}