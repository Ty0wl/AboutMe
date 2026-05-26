let gamesData = [];
let reviewsData = {};
let currentSort = 'id';
let sortDirection = {};
let toastTimeout;

document.addEventListener('DOMContentLoaded', async function() {
    await loadReviews();
    await loadGames();
    setupSortButtons();
    setupModalEvents();
    setupLegendParticles();
    setupNavIconHover();
});

async function loadReviews() {
    try {
        const res = await fetch('reviews.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        reviewsData = await res.json();
        console.log('reviews.json загружен:', Object.keys(reviewsData));
        return reviewsData;
    } catch (err) {
        console.error('Ошибка reviews.json:', err);
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
        console.log('games.json загружен, таблица отрисована');
    } catch (error) {
        console.error('Ошибка games.json:', error);
        document.getElementById('games-table-body').innerHTML = 
            '<tr><td colspan="6" style="color: #F04F78; font-size: 24px;">Ошибка загрузки данных</td></tr>';
    }
}

function renderTable() {
    const tbody = document.getElementById('games-table-body');
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

function setupGradeClicks() {
    document.querySelectorAll('#games-table-body .grade-badge').forEach(badge => {
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

function setupLegendParticles() {
    console.log('🔍 setupLegendParticles вызвана');
    
    const legendBadges = document.querySelectorAll('.legend-box .grade-badge');
    console.log(`Найдено бейджей в легенде: ${legendBadges.length}`);
    
    const gradeParticleMap = {
        'grade-a-plus': 'resources/gfx/particles/particle_a_plus.png',
        'grade-a':      'resources/gfx/particles/particle_a.png',
        'grade-b':      'resources/gfx/particles/particle_b.png',
        'grade-c':      'resources/gfx/particles/particle_c.png',
        'grade-d':      'resources/gfx/particles/particle_d.png'
    };

    legendBadges.forEach((badge, index) => {
        console.log(`[${index}] Бейдж:`, badge.textContent, 'Классы:', Array.from(badge.classList));
        badge.style.cursor = 'pointer';
        
        badge.addEventListener('click', (e) => {
            console.log('КЛИК по бейджу!', badge.textContent);
            e.stopPropagation();
            
            const rect = badge.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            console.log(`Координаты: x=${x}, y=${y}`);
            
            let particleSrc = 'resources/gfx/particles/particle_a.png';
            for (const [cls, src] of Object.entries(gradeParticleMap)) {
                if (badge.classList.contains(cls)) {
                    particleSrc = src;
                    console.log(`Найдена частица для ${cls}: ${particleSrc}`);
                    break;
                }
            }
            
            spawnParticles(x, y, particleSrc);
        });
    });
}

function spawnParticles(originX, originY, imagePath) {
    console.log(`💥 spawnParticles вызвана с: ${imagePath}`);
    
    const count = 15;
    for (let i = 0; i < count; i++) {
        const img = document.createElement('img');
        img.src = `${imagePath}?t=${Date.now()}`;
        img.alt = 'particle';
        
        Object.assign(img.style, {
            position: 'fixed',
            left: `${originX}px`,
            top: `${originY}px`,
            width: '20px',
            height: '20px',
            pointerEvents: 'none',
            zIndex: '3000',
            transition: 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
            opacity: '1',
            transform: 'translate(-50%, -50%) scale(1)',
            imageRendering: 'pixelated'
        });
        
        document.body.appendChild(img);
        console.log(`Частица ${i} создана`);

        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 80;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance - 30;

        requestAnimationFrame(() => {
            img.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0.1)`;
            img.style.opacity = '0';
        });

        setTimeout(() => {
            img.remove();
            console.log(`🗑️ Частица ${i} удалена`);
        }, 850);
    }
}

// Открытие модального окна
function openReviewModal(gameId) {
    const modal = document.getElementById('review-modal');
    const titleEl = document.getElementById('modal-title');
    const textEl = document.getElementById('modal-text');

    // Преобразуем ID в строку, т.к. ключи в JSON всегда строки
    const review = reviewsData[String(gameId)];
    console.log(`🔍 Поиск ID "${gameId}" в reviews.json →`, review);

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

function setupModalEvents() {
    const modal = document.getElementById('review-modal');
    const modalCloseBtn = document.getElementById('modal-close');
    const toastCloseBtn = document.getElementById('toast-close');

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeReviewModal);
    if (toastCloseBtn) toastCloseBtn.addEventListener('click', closeReviewToast);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeReviewModal();
        });
    }

    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeReviewModal();
            closeReviewToast();
        }
    });
}

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
    document.querySelector('[data-sort="id"]')?.classList.add('active');
}

function sortGames(field) {
    if (!(field in sortDirection)) sortDirection[field] = 'asc';
    else sortDirection[field] = sortDirection[field] === 'asc' ? 'desc' : 'asc';

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
    setupGradeClicks(); // Перепривязка кликов после перерисовки
}

// ===== ДИНАМИЧЕСКАЯ СМЕНА ИКОНОК ПРИ НАВЕДЕНИИ =====
function setupNavIconHover() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        const icon = btn.querySelector('.nav-icon');
        if (!icon) return;
        
        // Получаем базовый URL иконки
        const originalSrc = icon.src;
        
        // Определяем, какая это кнопка (домой или игры)
        const isHomeBtn = btn.getAttribute('href') === 'index.html';
        const isGamesBtn = btn.getAttribute('href') === 'games.html';
        
        // Формируем URL для "on" версии
        let hoverSrc = '';
        if (isHomeBtn) {
            hoverSrc = 'https://raw.githubusercontent.com/Ty0wl/AboutMe/main/resources/gfx/ui/icon_home_on.png';
        } else if (isGamesBtn) {
            hoverSrc = 'https://raw.githubusercontent.com/Ty0wl/AboutMe/main/resources/gfx/ui/icon_games_off.png';
        }
        
        // Событие наведения
        btn.addEventListener('mouseenter', () => {
            if (!btn.classList.contains('active')) {
                icon.src = hoverSrc;
            }
        });
        
        // Событие ухода мыши
        btn.addEventListener('mouseleave', () => {
            if (!btn.classList.contains('active')) {
                icon.src = originalSrc;
            }
        });
    });
}