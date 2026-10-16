/*
 * Блок «Новости и объявления» + полоса срочного объявления.
 * Данные берутся из Firestore (коллекция news), обновляются в реальном времени.
 */
(function () {
    var TYPE_ICONS = { 'Новость': '📰', 'Объявление': '📢', 'Работы': '🔧', 'Собрание': '👥', 'Срочно': '⚠️' };
    var activeComplex = '';
    var items = [];

    function esc(str) {
        var d = document.createElement('div');
        d.textContent = str == null ? '' : String(str);
        return d.innerHTML;
    }

    function fmt(ts) {
        var d = ts && typeof ts.toDate === 'function' ? ts.toDate() : null;
        return d ? d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    }

    function renderBanner() {
        var bar = document.getElementById('urgentBanner');
        if (!bar) return;
        var u = items.filter(function (n) { return n.urgent; })[0];
        if (!u) { bar.hidden = true; bar.innerHTML = ''; return; }
        bar.hidden = false;
        bar.innerHTML = '<div class="urgent-inner"><span class="urgent-tag">⚠️ Срочно</span> <strong>' +
            esc(u.title) + '</strong>' + (u.text ? ' — ' + esc(u.text.length > 140 ? u.text.slice(0, 140) + '…' : u.text) : '') +
            ' <a href="#news">Подробнее</a></div>';
    }

    function renderFilters() {
        var box = document.getElementById('newsFilters');
        if (!box) return;
        var set = {};
        items.forEach(function (n) { if (n.complex) set[n.complex] = true; });
        var names = Object.keys(set).sort();
        if (!names.length) { box.hidden = true; box.innerHTML = ''; return; }
        if (activeComplex && !set[activeComplex]) activeComplex = '';
        box.hidden = false;
        box.innerHTML = ['Все'].concat(names).map(function (name) {
            var val = name === 'Все' ? '' : name;
            return '<button type="button" class="news-filter' + (val === activeComplex ? ' active' : '') +
                '" data-complex="' + esc(val) + '">' + esc(name) + '</button>';
        }).join('');
    }

    function renderGrid() {
        var grid = document.getElementById('newsGrid');
        if (!grid) return;
        var list = items.filter(function (n) { return !activeComplex || !n.complex || n.complex === activeComplex; });
        if (!list.length) {
            grid.innerHTML = '<p class="news-empty">Пока нет новостей. Скоро здесь появится важная информация для жителей.</p>';
            return;
        }
        grid.innerHTML = list.map(function (n) {
            var image = n.image
                ? '<div class="news-image has-photo"><img src="' + esc(n.image) + '" alt="' + esc(n.title) + '" loading="lazy"></div>'
                : '<div class="news-image">' + (TYPE_ICONS[n.type] || '📰') + '</div>';
            var meta = '<span class="news-badge' + (n.urgent ? ' urgent' : '') + '">' + esc(n.urgent ? 'Срочно' : (n.type || 'Новость')) + '</span>' +
                (n.complex ? '<span class="news-complex">' + esc(n.complex) + '</span>' : '');
            return '<article class="news-card' + (n.urgent ? ' is-urgent' : '') + '">' + image +
                '<div class="news-content"><div class="news-meta">' + meta + '</div>' +
                '<div class="news-date">' + fmt(n.createdAt) + '</div>' +
                '<h3>' + esc(n.title) + '</h3>' +
                '<p>' + esc(n.text).replace(/\n/g, '<br>') + '</p></div></article>';
        }).join('');
    }

    function renderAll() { renderBanner(); renderFilters(); renderGrid(); }

    document.addEventListener('DOMContentLoaded', function () {
        var grid = document.getElementById('newsGrid');
        if (!grid || typeof db === 'undefined') return;

        var filters = document.getElementById('newsFilters');
        if (filters) filters.addEventListener('click', function (e) {
            var b = e.target.closest('.news-filter');
            if (!b) return;
            activeComplex = b.getAttribute('data-complex') || '';
            renderFilters();
            renderGrid();
        });

        db.collection('news').orderBy('createdAt', 'desc').limit(30).onSnapshot(
            function (snap) {
                items = snap.docs.map(function (d) { return d.data(); });
                renderAll();
            },
            function (err) {
                console.error('news load error', err);
                grid.innerHTML = '<p class="news-empty">Не удалось загрузить новости. Попробуйте обновить страницу.</p>';
            }
        );
    });
})();
