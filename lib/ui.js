define(
    [
        'log'
    ],
    function (log) {
}
        // The UI system is reponsible for consolidating APIs
        // related to managing the user interface.

        function show() {

            var badge  = getBadgeElement(),
                result = badge;

            log.info('Showing user interface.');

            badge.addEventListener('click', onBadgeClick);
            addTouchSupport(badge);
            attachBadge(badge);
            showBadge(badge);

            // todo: return 'undefined' if there is no element is ready to use.
            return result;
        }

        return {
            show : show
        };
    }
);
