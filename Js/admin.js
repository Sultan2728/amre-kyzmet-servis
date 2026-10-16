/* Админ-панель: вход через Firebase Auth, публикация новостей в Firestore. */
(function () {
    var auth = firebase.auth();
    var $ = function (id) { return document.getElementById(id); };
    var editingId = null;
    var photoData = '';      // текущее фото (data URL) или ''
    var cache = [];

    function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
    function msg(el, text, ok) { el.textContent = text || ''; el.className = 'admin-msg' + (ok ? ' ok' : ''); }

    /* ---------- вход ---------- */
    $('loginForm').addEventListener('submit', function (e) {
        e.preventDefault();
        msg($('loginMsg'), 'Вход…', true);
        auth.signInWithEmailAndPassword($('loginEmail').value.trim(), $('loginPass').value)
            .then(function () { msg($('loginMsg'), ''); })
            .catch(function () { msg($('loginMsg'), 'Неверный email или пароль.'); });
    });
    $('logoutBtn').addEventListener('click', function () { auth.signOut(); });

    var unsub = null;
    auth.onAuthStateChanged(function (user) {
        $('loginForm').hidden = !!user;
        $('panel').hidden = !user;
        if (unsub) { unsub(); unsub = null; }
        if (!user) return;
        $('whoami').textContent = 'Вы вошли как ' + user.email;
        unsub = db.collection('news').orderBy('createdAt', 'desc').limit(100).onSnapshot(function (snap) {
            cache = snap.docs.map(function (d) { var o = d.data(); o.id = d.id; return o; });
            renderList();
        }, function () { $('adminList').textContent = 'Нет доступа к данным. Проверьте правила Firestore.'; });
    });

    /* ---------- фото: сжимаем в браузере, храним прямо в документе ---------- */
    function shrink(file) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            var url = URL.createObjectURL(file);
            img.onload = function () {
                var max = 900, w = img.width, h = img.height, k = Math.min(1, max / Math.max(w, h));
                var c = document.createElement('canvas');
                c.width = Math.round(w * k); c.height = Math.round(h * k);
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                URL.revokeObjectURL(url);
                var q = 0.75, data = c.toDataURL('image/jpeg', q);
                while (data.length > 400000 && q > 0.3) { q -= 0.1; data = c.toDataURL('image/jpeg', q); }
                resolve(data);
            };
            img.onerror = function () { reject(new Error('bad image')); };
            img.src = url;
        });
    }
    function showPhoto() {
        $('photoPreview').hidden = !photoData;
        if (photoData) $('photoImg').src = photoData;
    }
    $('nPhoto').addEventListener('change', function () {
        var f = this.files[0];
        if (!f) return;
        shrink(f).then(function (d) { photoData = d; showPhoto(); })
                 .catch(function () { msg($('formMsg'), 'Не удалось прочитать фото.'); });
    });
    $('photoRemove').addEventListener('click', function () { photoData = ''; $('nPhoto').value = ''; showPhoto(); });

    /* ---------- форма ---------- */
    function resetForm() {
        editingId = null; photoData = '';
        $('newsForm').reset(); showPhoto();
        $('formTitle').textContent = 'Новая публикация';
        $('saveBtn').textContent = 'Опубликовать';
        $('cancelEdit').hidden = true;
    }
    $('cancelEdit').addEventListener('click', resetForm);

    $('newsForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = $('saveBtn');
        var data = {
            title: $('nTitle').value.trim(),
            text: $('nText').value.trim(),
            type: $('nType').value,
            complex: $('nComplex').value.trim(),
            urgent: $('nUrgent').checked,
            image: photoData
        };
        if (!data.title || !data.text) return;
        btn.disabled = true; msg($('formMsg'), 'Сохранение…', true);

        var op;
        if (editingId) {
            op = db.collection('news').doc(editingId).update(data);
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            op = db.collection('news').add(data);
        }
        op.then(function () { resetForm(); msg($('formMsg'), 'Готово — опубликовано на сайте.', true); })
          .catch(function (err) { console.error(err); msg($('formMsg'), 'Не удалось сохранить. Проверьте правила Firestore и вход.'); })
          .finally(function () { btn.disabled = false; });
    });

    /* ---------- список ---------- */
    function renderList() {
        var set = {};
        cache.forEach(function (n) { if (n.complex) set[n.complex] = 1; });
        $('complexList').innerHTML = Object.keys(set).map(function (c) { return '<option value="' + esc(c) + '">'; }).join('');

        var box = $('adminList');
        if (!cache.length) { box.textContent = 'Пока ничего не опубликовано.'; return; }
        box.innerHTML = cache.map(function (n) {
            var d = n.createdAt && n.createdAt.toDate ? n.createdAt.toDate().toLocaleDateString('ru-RU') : '…';
            return '<div class="admin-item"><div class="admin-item-info"><strong>' + (n.urgent ? '⚠️ ' : '') + esc(n.title) + '</strong>' +
                '<small>' + esc(n.type) + (n.complex ? ' · ' + esc(n.complex) : '') + ' · ' + d + '</small></div>' +
                '<div class="admin-item-btns"><button data-act="edit" data-id="' + n.id + '">Изменить</button>' +
                '<button class="del" data-act="del" data-id="' + n.id + '">Удалить</button></div></div>';
        }).join('');
    }
    $('adminList').addEventListener('click', function (e) {
        var b = e.target.closest('button[data-act]');
        if (!b) return;
        var id = b.getAttribute('data-id');
        var n = cache.filter(function (x) { return x.id === id; })[0];
        if (!n) return;
        if (b.getAttribute('data-act') === 'del') {
            if (confirm('Удалить «' + n.title + '»?')) db.collection('news').doc(id).delete().catch(function () { alert('Не удалось удалить.'); });
            return;
        }
        editingId = id; photoData = n.image || '';
        $('nTitle').value = n.title; $('nText').value = n.text; $('nType').value = n.type || 'Новость';
        $('nComplex').value = n.complex || ''; $('nUrgent').checked = !!n.urgent;
        showPhoto();
        $('formTitle').textContent = 'Редактирование';
        $('saveBtn').textContent = 'Сохранить изменения';
        $('cancelEdit').hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();
