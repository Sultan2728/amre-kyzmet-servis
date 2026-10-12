/*
 * Блок «Отзывы».
 * Отзывы хранятся в localStorage браузера посетителя (ключ ниже),
 * поэтому работают сразу после публикации сайта без отдельного сервера.
 * Важно: это хранилище локальное для каждого браузера — отзыв, оставленный
 * с одного телефона или компьютера, не появится у другого посетителя.
 * Если нужен общий список отзывов для всех посетителей сайта,
 * потребуется подключить базу данных на сервере.
 */
(function () {
    var STORAGE_KEY = 'aks_reviews_v1';

    var seedReviews = [
        {
            name: 'Айгерим Т.',
            rating: 5,
            text: 'Быстро отреагировали на заявку по отоплению, приехали в тот же день. Спасибо за оперативность!',
            date: '2026-09-18'
        },
        {
            name: 'Марат Б.',
            rating: 4,
            text: 'Во дворе стало чище, регулярно убирают. Хотелось бы ещё освещение возле детской площадки поправить.',
            date: '2026-08-02'
        }
    ];

    function loadReviews() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) { /* localStorage недоступен — работаем без сохранения */ }
        return seedReviews.slice();
    }

    function saveReviews(reviews) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
        } catch (e) { /* недоступно (приватный режим и т.п.) — тихо игнорируем */ }
    }

    function formatDate(iso) {
        var d = new Date(iso + 'T00:00:00');
        if (isNaN(d.getTime())) return iso;
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function starsMarkup(rating) {
        var out = '';
        for (var i = 1; i <= 5; i++) {
            out += '<span class="star-display' + (i <= rating ? ' filled' : '') + '">★</span>';
        }
        return out;
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function render() {
        var list = document.getElementById('reviewsList');
        if (!list) return;

        var reviews = loadReviews().slice().sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });

        if (reviews.length === 0) {
            list.innerHTML = '<p class="reviews-empty">Пока нет отзывов — станьте первым!</p>';
            return;
        }

        list.innerHTML = reviews.map(function (r) {
            return (
                '<div class="review-card">' +
                    '<div class="review-head">' +
                        '<strong>' + escapeHtml(r.name) + '</strong>' +
                        '<span class="review-stars">' + starsMarkup(r.rating) + '</span>' +
                    '</div>' +
                    '<p class="review-text">' + escapeHtml(r.text) + '</p>' +
                    '<div class="review-date">' + formatDate(r.date) + '</div>' +
                '</div>'
            );
        }).join('');
    }

    function initStars() {
        var starInput = document.getElementById('starInput');
        var ratingField = document.getElementById('reviewRating');
        if (!starInput || !ratingField) return;

        var stars = starInput.querySelectorAll('.star');

        function paint(value) {
            stars.forEach(function (s) {
                s.classList.toggle('active', parseInt(s.dataset.value, 10) <= value);
            });
        }

        paint(parseInt(ratingField.value, 10));

        stars.forEach(function (s) {
            s.addEventListener('click', function () {
                var value = parseInt(s.dataset.value, 10);
                ratingField.value = value;
                paint(value);
            });
            s.addEventListener('mouseenter', function () {
                paint(parseInt(s.dataset.value, 10));
            });
        });

        starInput.addEventListener('mouseleave', function () {
            paint(parseInt(ratingField.value, 10));
        });
    }

    function initForm() {
        var form = document.getElementById('reviewForm');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var name = document.getElementById('reviewName').value.trim();
            var text = document.getElementById('reviewText').value.trim();
            var rating = parseInt(document.getElementById('reviewRating').value, 10) || 5;

            if (!name || !text) return;

            var reviews = loadReviews();
            reviews.push({
                name: name,
                rating: rating,
                text: text,
                date: new Date().toISOString().slice(0, 10)
            });
            saveReviews(reviews);
            render();

            form.reset();
            document.getElementById('reviewRating').value = 5;
            initStars();
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        render();
        initStars();
        initForm();
    });
})();
