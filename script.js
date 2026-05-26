let gamesData = [];
let reviewsData = {};
let currentSort = 'id';
let sortDirection = {};
let toastTimeout;

document.addEventListener('DOMContentLoaded', function() {
    loadReviews();
    loadGames();
    setupSortButtons();
    setupModalEvents();
});

async function loadReviews() {
    try {
        const res = await fetch('reviews.json');
        if (!res.ok) throw new Error('Файл не найден');
        reviewsData = await res.json();
    } catch (err) {
        console.warn('reviews.json не загружен:', err);
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
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('games-table-body').innerHTML = 
            '<tr><td colspan="6" style="color: #F04F78; font-size: 24px;">Ошибка загрузки данных. Проверьте games.json</td></tr>';
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
    document.querySelectorAll('.grade-badge').forEach(badge => {
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

function openReviewModal(gameId) {
    const modal = document.getElementById('review-modal');
    const titleEl = document.getElementById('modal-title');
    const textEl = document.getElementById('modal-text');

    const review = reviewsData[gameId];
    if (review) {
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