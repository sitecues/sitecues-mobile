define(
    [
        './badge',
        'log'
    ],
    function (badge, log) {

        // The UI system is reponsible for consolidating APIs
        // related to managing the user interface.

        // For now, we simply delegate to the badge module. But in the future,
        // there could easily be other UI components, in which case those
        // should be handled here. By having other modules use the appropriate
        // semantic API, we make that process easier in the future.
        return {
            init : badge.init
        };
    }
);
