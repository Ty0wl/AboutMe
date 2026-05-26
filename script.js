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
        
        // Запускаем эффекты с небольшой задержкой
        setTimeout(() => {
            setupNavIconHover();
            setupLegendParticles();
        }, 100);
    } catch (err) {
        console.error('❌ Ошибка инициализации:', err);
    }
});

// ===== ЗАГРУЗКА ДАННЫХ =====
async function loadReviews() {
    try {
        const res = await fetch('reviews.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        reviewsData = await res.json();
        console.log('✅ reviews.json загружен:', Object.keys(reviewsData));
    } catch (err) {
        console.error('❌ Ошибка reviews.json:', err);
        reviewsData = {};
    }
}

async function loadGames() {
    try {
        const response = await fetch('games.json');
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        gamesData = await response.json();
        renderTable();
        setupGradeClicks();
        console.log('✅ games.json загружен');
    } catch (error) {
        console.error('❌ Ошибка games.json:', error);
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

// ===== ЧАСТИЦЫ ДЛЯ ЛЕГЕНДЫ (PNG + FALLBACK) =====
function setupLegendParticles() {
    console.log('🔍 setupLegendParticles: запуск');
    const badges = document.querySelectorAll('.legend-box .grade-badge');

    const gradeParticleMap = {
        'grade-a-plus': 'resources/gfx/particles/particle_a_plus.png',
        'grade-a':      'resources/gfx/particles/particle_a.png',
        'grade-b':      'resources/gfx/particles/particle_b.png',
        'grade-c':      'resources/gfx/particles/particle_c.png',
        'grade-d':      'resources/gfx/particles/particle_d.png'
    };

    // Цвета на случай, если картинка не загрузится
    const gradeColorMap = {
        'grade-a-plus': '#13AD66', 'grade-a': '#91DB69', 'grade-b': '#4D9BE6',
        'grade-c': '#F79617', 'grade-d': '#F04F78'
    };

    badges.forEach(badge => {
        badge.style.cursor = 'pointer';
        badge.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = badge.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            let particlePath = '';
            let particleColor = '#FFFFFF';
            
            for (const [cls, path] of Object.entries(gradeParticleMap)) {
                if (badge.classList.contains(cls)) {
                    particlePath = path;
                    particleColor = gradeColorMap[cls];
                    break;
                }
            }
            
            spawnParticles(x, y, particlePath, particleColor);
        });
    });
}

function spawnParticles(originX, originY, imagePath) {
    const count = 15;
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('img');
        particle.src = `${imagePath}?t=${Date.now()}`; // Анти-кэш
        particle.alt = 'particle';
        
        // Стили
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
        
        particle.onerror = function() {
            console.error(' Частица не найдена:', imagePath);
            this.remove();
        };

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
function openReviewModal(gameId) {
    const modal = document.getElementById('review-modal');
    const review = reviewsData[String(gameId)];
    
    document.getElementById('modal-title').textContent = review ? review.title : `Игра #${gameId}`;
    document.getElementById('modal-text').textContent = review ? review.text : 'Текст рецензии отсутствует.';
    
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

// ===== ДИНАМИЧЕСКИЕ ИКОНКИ НАВИГАЦИИ =====
function setupNavIconHover() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const icon = btn.querySelector('.nav-icon');
        if (!icon) return;

        const href = btn.getAttribute('href');
        const isHome = href === 'index.html';
        const isGames = href === 'games.html';
        if (!isHome && !isGames) return;

        const type = isHome ? 'home' : 'games';
        const offSrc = `https://raw.githubusercontent.com/Ty0wl/AboutMe/main/resources/gfx/ui/icon_${type}_off.png`;
        const onSrc  = `https://raw.githubusercontent.com/Ty0wl/AboutMe/main/resources/gfx/ui/icon_${type}_on.png`;

        const isActive = btn.classList.contains('active');

        btn.onmouseenter = null;
        btn.onmouseleave = null;

        if (isActive) {
            icon.src = onSrc;
        } else {
            icon.src = offSrc;
            btn.onmouseenter = () => { icon.src = onSrc; };
            btn.onmouseleave = () => { icon.src = offSrc; };
        }
        
        console.log(` [${type}] Активна: ${isActive} | Текущий src: ${icon.src}`);
    });
}