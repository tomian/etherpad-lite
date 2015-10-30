/**
 * Reload plugin example
 */
(function ($window, $document, bs) {

    var socket = bs.socket;
    var canReload = false;

    socket.on("connection", function (client) {
        console.warn('BS connected');
        if (canReload) {
            canReload = false;
            console.warn('BS is reloading');
            window.location.reload();
        }
    });
    socket.on("disconnect", function (client) {
        console.warn('BS disconnected');
        canReload = true;
    });

})(window, document, ___browserSync___);
