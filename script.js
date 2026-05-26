// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let gamesData = [];
let reviewsData = {};
let currentSort = 'id';
let sortDirection = {};
let toastTimeout;

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Инициализация сайта...');
    try {
        await loadReviews();
        await loadGames();
        setupSortButtons();
        setupModalEvents();
        setupNavIconHover();
        
        // Небольшая задержка для гарантии готовности DOM
        setTimeout(() => {
            try {
                setupLegendParticles();
            } catch (err) {
                console.error('❌ Ошибка в setupLegendParticles:', err);
            }
        }, 100);
    } catch (err) {
        console.error('❌ Критическая ошибка инициализации:', err);
    }
});

// ===== ЗАГРУЗКА ДАННЫХ =====
async function loadReviews() {
    try {
        const res = await fetch('reviews.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        reviewsData = await res.json();
        console.log('✅ reviews.json загружен:', Object.keys(reviewsData));
        return reviewsData;
    } catch (err) {
        console.error('❌ Ошибка reviews.json:', err);
        reviewsData = {};
        return {};
    }
}

async function loadGames() {
    try {
        const response = await fetch('games.json');
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        gamesData = await response.json();
        renderTable();
        setupGradeClicks();
        console.log('✅ games.json загружен, таблица отрисована');
    } catch (error) {
        console.error('❌ Ошибка games.json:', error);
        const tbody = document.getElementById('games-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="color: #F04F78; font-size: 24px; text-align: center; padding: 20px;">Ошибка загрузки данных</td></tr>';
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
            <td><img src="${game.cover}" alt="${game.name}" class="game-cover" onerror="this.src='covers/no-image.png'"></td>
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

// ===== ЧАСТИЦЫ ДЛЯ ЛЕГЕНДЫ (PNG-версия) =====
function setupLegendParticles() {
    console.log('🔍 setupLegendParticles: запуск');
    const badges = document.querySelectorAll('.legend-box .grade-badge');
    console.log(`📊 Найдено бейджей в легенде: ${badges.length}`);

    if (badges.length === 0) {
        console.warn('⚠️ Бейджи легенды не найдены! Проверь HTML.');
        return;
    }

    // 🔥 Пути к PNG-частицам (замени на свои реальные пути!)
    const gradeParticleMap = {
        'grade-a-plus': 'resources/gfx/particles/particle_a_plus.png',
        'grade-a':      'resources/gfx/particles/particle_a.png',
        'grade-b':      'resources/gfx/particles/particle_b.png',
        'grade-c':      'resources/gfx/particles/particle_c.png',
        'grade-d':      'resources/gfx/particles/particle_d.png'
    };

    badges.forEach((badge, index) => {
        badge.style.cursor = 'pointer';
        
        badge.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const rect = badge.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            // Определяем путь к частице по классу
            let particlePath = 'resources/gfx/particles/particle_default.png';
            for (const [cls, path] of Object.entries(gradeParticleMap)) {
                if (badge.classList.contains(cls)) {
                    particlePath = path;
                    break;
                }
            }
            
            spawnParticles(x, y, particlePath);
        });
        console.log(`✅ Слушатель добавлен на бейдж [${index}]: ${badge.textContent}`);
    });
    console.log('✨ Все обработчики легенды активны');
}

function spawnParticles(originX, originY, imagePath) {
    console.log(`💥 spawnParticles: старт (${imagePath})`);
    
    const count = 15;
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('img');
        
        // Добавляем timestamp чтобы избежать кэширования
        particle.src = `${imagePath}?t=${Date.now()}-${i}`;
        particle.alt = 'particle';
        
        // 🔥 СТИЛИ ЧЕРЕЗ ОТДЕЛЬНЫЕ СВОЙСТВА (надёжнее, чем Object.assign)
        particle.style.position = 'fixed';
        particle.style.left = originX + 'px';
        particle.style.top = originY + 'px';
        particle.style.width = '18px';
        particle.style.height = '18px';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '999999';
        particle.style.opacity = '1';
        particle.style.transform = 'translate(-50%, -50%) scale(1)';
        particle.style.imageRendering = 'pixelated'; // Для чёткости пиксель-арта
        
        document.body.appendChild(particle);
        
        // Случайный вектор разлёта
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const distance = 70 + Math.random() * 60;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance - 30; // Лёгкий подъём вверх
        
        // Форсируем перерисовку перед анимацией
        particle.offsetHeight;
        
        // Применяем анимацию
        particle.style.transition = 'all 0.75s cubic-bezier(0.2, 0.8, 0.2, 1)';
        particle.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0.1)`;
        particle.style.opacity = '0';
        
        // Удаляем после анимации
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 800);
    }
    console.log('✅ Все частицы запущены');
}

// ===== МОДАЛЬНОЕ ОКНО РЕЦЕНЗИИ =====
function openReviewModal(gameId) {
    const modal = document.getElementById('review-modal');
    const titleEl = document.getElementById('modal-title');
    const textEl = document.getElementById('modal-text');

    const review = reviewsData[String(gameId)];
    console.log(`🔍 Поиск рецензии для ID "${gameId}":`, review);

    if (review && review.text) {
        titleEl.textContent = review.title || `Игра #${gameId}`;
        textEl.textContent = review.text;
    } else {
        titleEl.textContent = `Игра #${gameId}`;
        textEl.textContent = 'Текст рецензии отсутствует.';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeReviewModal() {
    const modal = document.getElementById('review-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ===== УВЕДОМЛЕНИЕ (TOAST) =====
function showReviewToast() {
    const toast = document.getElementById('review-toast');
    toast.classList.add('active');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('active');
    }, 5000);
}

function closeReviewToast() {
    const toast = document.getElementById('review-toast');
    toast.classList.remove('active');
    clearTimeout(toastTimeout);
}

// ===== ОБРАБОТЧИКИ МОДАЛКИ И ТОАСТА =====
function setupModalEvents() {
    const modal = document.getElementById('review-modal');
    const modalCloseBtn = document.getElementById('modal-close');
    const toastCloseBtn = document.getElementById('toast-close');

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeReviewModal);
    }
    if (toastCloseBtn) {
        toastCloseBtn.addEventListener('click', closeReviewToast);
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeReviewModal();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeReviewModal();
            closeReviewToast();
        }
    });
}

// ===== СОРТИРОВКА ТАБЛИЦЫ =====
function setupSortButtons() {
    const sortButtons = document.querySelectorAll('.sort-btn');
    sortButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const sortField = this.getAttribute('data-sort');
            sortButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            sortGames(sortField);
        });
    });
    const defaultBtn = document.querySelector('[data-sort="id"]');
    if (defaultBtn) defaultBtn.classList.add('active');
}

function sortGames(field) {
    if (!(field in sortDirection)) {
        sortDirection[field] = 'asc';
    } else {
        sortDirection[field] = sortDirection[field] === 'asc' ? 'desc' : 'asc';
    }

    gamesData.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];
        
        if (typeof valA === 'number' && typeof valB === 'number') {
            return sortDirection[field] === 'asc' ? valA - valB : valB - valA;
        }
        
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
        return sortDirection[field] === 'asc' 
            ? valA.localeCompare(valB, 'ru') 
            : valB.localeCompare(valA, 'ru');
    });
    
    renderTable();
    setupGradeClicks();
}

// ===== ДИНАМИЧЕСКИЕ ИКОНКИ НАВИГАЦИИ =====
function setupNavIconHover() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        const icon = btn.querySelector('.nav-icon');
        if (!icon) return;
        
        const originalSrc = icon.src;
        
        // Формируем hover-версию: _off → _on
        const hoverSrc = originalSrc.replace(/_off\.png$/i, '_on.png');
        
        btn.addEventListener('mouseenter', () => {
            if (!btn.classList.contains('active') && originalSrc.includes('_off')) {
                icon.src = hoverSrc;
            }
        });
        
        btn.addEventListener('mouseleave', () => {
            if (!btn.classList.contains('active')) {
                icon.src = originalSrc;
            }
        });
    });
}