let gamesData = [];
let currentSort = 'id';
let sortDirection = {};

// Загрузка данных при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadGames();
    setupSortButtons();
});

// Загрузка JSON
async function loadGames() {
    try {
        const response = await fetch('games.json');
        if (!response.ok) {
            throw new Error('Ошибка загрузки данных');
        }
        gamesData = await response.json();
        renderTable();
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('games-table-body').innerHTML = 
            '<tr><td colspan="6" style="color: #F04F78; font-size: 24px;">Ошибка загрузки данных. Проверьте файл games.json</td></tr>';
    }
}

// Отрисовка таблицы
function renderTable() {
    const tbody = document.getElementById('games-table-body');
    tbody.innerHTML = '';

    gamesData.forEach(game => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${game.cover}" alt="${game.name}" class="game-cover" onerror="this.src='https://via.placeholder.com/120x160?text=No+Image'"></td>
            <td>${game.year}</td>
            <td>${game.type}</td>
            <td>${game.genre}</td>
            <td>${game.name}</td>
            <td><span class="grade-badge grade-${game.grade.toLowerCase().replace('+', '-plus')}">${game.grade}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Настройка кнопок сортировки
function setupSortButtons() {
    const sortButtons = document.querySelectorAll('.sort-btn');
    sortButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const sortField = this.getAttribute('data-sort');
            
            // Обновляем активную кнопку
            sortButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Сортируем
            sortGames(sortField);
        });
    });
    
    // Устанавливаем ID как активную по умолчанию
    document.querySelector('[data-sort="id"]').classList.add('active');
}

// Сортировка игр
function sortGames(field) {
    // Инициализация направления сортировки если нужно
    if (!(field in sortDirection)) {
        sortDirection[field] = 'asc';
    } else {
        // Переключаем направление
        sortDirection[field] = sortDirection[field] === 'asc' ? 'desc' : 'asc';
    }

    gamesData.sort((a, b) => {
        let valueA = a[field];
        let valueB = b[field];

        // Для числовых полей (год, id)
        if (typeof valueA === 'number' && typeof valueB === 'number') {
            return sortDirection[field] === 'asc' ? valueA - valueB : valueB - valueA;
        }

        // Для строк
        valueA = String(valueA).toLowerCase();
        valueB = String(valueB).toLowerCase();

        if (sortDirection[field] === 'asc') {
            return valueA.localeCompare(valueB, 'ru');
        } else {
            return valueB.localeCompare(valueA, 'ru');
        }
    });

    renderTable();
}