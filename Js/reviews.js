/*
 * Блок «Отзывы».
 * Отзывы хранятся в общей базе данных Firestore (Firebase), поэтому
 * отзыв, оставленный одним посетителем, сразу видят все остальные —
 * список на странице обновляется в реальном времени (без перезагрузки).
 */
(function () {
    var COLLECTION = 'reviews';

    function formatDate(ts) {
        var d = (ts && typeof ts.toDate === 'function') ? ts.toDate() : null;
        if (!d) return '';
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

    function renderReviews(docs) {
        var list = document.getElementById('reviewsList');
        if (!list) return;

        if (docs.length === 0) {
            list.innerHTML = '<p class="reviews-empty">Пока нет отзывов — станьте первым!</p>';
            return;
        }

        list.innerHTML = docs.map(function (doc) {
            var r = doc.data();
            return (
                '<div class="review-card">' +
                    '<div class="review-head">' +
                        '<strong>' + escapeHtml(r.name || '') + '</strong>' +
                        '<span class="review-stars">' + starsMarkup(r.rating || 0) + '</span>' +
                    '</div>' +
                    '<p class="review-text">' + escapeHtml(r.text || '') + '</p>' +
                    '<div class="review-date">' + formatDate(r.createdAt) + '</div>' +
                '</div>'
            );
        }).join('');
    }

    function listenReviews() {
        var list = document.getElementById('reviewsList');
        if (!list || typeof db === 'undefined') return;

        list.innerHTML = '<p class="reviews-empty">Загрузка отзывов…</p>';

        db.collection(COLLECTION)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .onSnapshot(
                function (snapshot) { renderReviews(snapshot.docs); },
                function (err) {
                    console.error('reviews load error', err);
                    list.innerHTML = '<p class="reviews-empty">Не удалось загрузить отзывы. Попробуйте обновить страницу.</p>';
                }
            );
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
            var submitBtn = form.querySelector('.review-submit');

            if (!name || !text || typeof db === 'undefined') return;

            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка…';

            db.collection(COLLECTION).add({
                name: name.slice(0, 60),
                text: text.slice(0, 500),
                rating: rating,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(function () {
                form.reset();
                document.getElementById('reviewRating').value = 5;
                initStars();
            }).catch(function (err) {
                console.error('review submit error', err);
                alert('Не удалось отправить отзыв. Попробуйте ещё раз чуть позже.');
            }).finally(function () {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Отправить отзыв';
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        listenReviews();
        initStars();
        initForm();
    });
})();
