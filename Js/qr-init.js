/* Рисует QR-коды. Любой элемент с атрибутом data-qr="страница.html"
   получает QR, который ведёт на эту страницу (полный адрес берётся
   от адреса текущей страницы, поэтому на хостинге всё работает само). */
document.querySelectorAll('[data-qr]').forEach(function (el) {
    var url = new URL(el.getAttribute('data-qr'), window.location.href).href;

    var qr = new QRCode(-1, QRErrorCorrectLevel.M);
    qr.addData(url);
    qr.make();

    var n = qr.getModuleCount();
    var quiet = 2;
    var size = n + quiet * 2;
    var d = '';

    for (var r = 0; r < n; r++) {
        for (var c = 0; c < n; c++) {
            if (qr.isDark(r, c)) {
                d += 'M' + (c + quiet) + ',' + (r + quiet) + 'h1v1h-1z';
            }
        }
    }

    el.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size +
        '" shape-rendering="crispEdges" role="img" aria-label="QR-код: страница о компании">' +
        '<rect width="' + size + '" height="' + size + '" fill="#fff"/>' +
        '<path d="' + d + '" fill="#000"/></svg>';
});
