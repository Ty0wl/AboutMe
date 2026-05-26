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
    console.log(`📊 Найдено бейджей в легенде: ${legendBadges.length}`);
    
    const gradeColorMap = {
        'grade-a-plus': '#13AD66',
        'grade-a':      '#91DB69',
        'grade-b':      '#4D9BE6',
        'grade-c':      '#F79617',
        'grade-d':      '#F04F78'
    };

    legendBadges.forEach((badge, index) => {
        console.log(`[${index}] Бейдж: "${badge.textContent}", классы:`, Array.from(badge.classList));
        badge.style.cursor = 'pointer';
        
        badge.addEventListener('click', (e) => {
            console.log('🖱️ КЛИК по бейджу!', badge.textContent);
            e.stopPropagation();
            
            const rect = badge.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            console.log(`📍 Координаты: x=${x}, y=${y}`);
            
            let particleColor = '#F79617';
            for (const [cls, color] of Object.entries(gradeColorMap)) {
                if (badge.classList.contains(cls)) {
                    particleColor = color;
                    console.log(`✅ Цвет для ${cls}: ${particleColor}`);
                    break;
                }
            }
            
            spawnParticles(x, y, particleColor);
        });
    });
}

function spawnParticles(originX, originY, color) {
    console.log('💥 Частицы запущены, цвет:', color);
    
    const count = 15;
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        
        particle.style.position = 'fixed';
        particle.style.left = originX + 'px';
        particle.style.top = originY + 'px';
        particle.style.width = '16px';
        particle.style.height = '16px';
        particle.style.backgroundColor = color;
        particle.style.border = '2px solid white';
        particle.style.borderRadius = '4px';
        particle.style.boxSizing = 'border-box';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '99999';
        particle.style.opacity = '1';
        
        document.body.appendChild(particle);
        
        // Анимация
        const angle = (Math.PI * 2 * i) / count;
        const distance = 80 + Math.random() * 50;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance;
        
        // Форсируем перерисовку
        particle.getBoundingClientRect();
        
        // Применяем анимацию
        particle.style.transition = 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
        particle.style.transform = 'translate(' + endX + 'px, ' + endY + 'px) scale(0)';
        particle.style.opacity = '0';
        
        // Удаляем
        setTimeout(function() {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 850);
    }
}

// Открытие модального окна
function openReviewModal(gameId) {
    const modal = document.getElementById('review-modal');
    const titleEl = document.getElementById('modal-title');
    const textEl = document.getElementById('modal-text');

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
        
        const originalSrc = icon.src;
        
        const srcParts = originalSrc.split('/');
        const fileName = srcParts[srcParts.length - 1];
        const baseName = fileName.replace(/_off\.png$/, '').replace(/_on\.png$/, '');
        
        const hoverSrc = originalSrc.replace(/_off\.png$/, '_on.png').replace(/_on\.png$/, '_on.png');
        
        btn.addEventListener('mouseenter', () => {
            if (!btn.classList.contains('active')) {
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