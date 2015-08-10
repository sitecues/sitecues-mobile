define(
    [
        'state',   // application-wide knowledge sharing
        'log',
        'audio/speech',
        'ui',
        'has'      // feature detection
    ],
    function (state, log, speech, ui, has) {

        // The core module is the main entry point of our application.
        // It launches the initial user experience.

        // We may initialize based on these document states.
        var okReadyStates = [
                'interactive', // DOM is ready, page is usable, like addEventListener('DOMContentLoaded' ...)
                'loaded',
                'complete'  // images are ready, like addEventListener('load' ...)
            ],
            // If the document is not in an acceptable ready state,
            // then this is the event we will wait for to start.
            okLoadEvent = 'DOMContentLoaded',
            // Actual status of the document when we run.
            readyState  = document.readyState,
            // Do we find the document status to be acceptable?
            isReady     = okReadyStates.indexOf(readyState) >= 0,
            config      = sitecues.config,
            scriptUrl,
            scriptProtocol;

            if (!config || typeof config !== 'object') {
                config = {};
            }

            scriptProtocol = sitecues.config.scriptUrl;

        state.siteId = sitecues.config.siteId;
        state.protocol = sitecues.config.protocol ||
            (sitecues.config.scriptUrl )
            (
                location.protocol.indexOf('http') === 0 ?
                    location.protocol                   :
                    'https'
            );

        if (isReady) {
            log.info('readyState \"' + readyState + '\" was acceptable to start.');
            start();
        }
        else {
            log.info('readyState \"' + readyState + '\" was unacceptable, adding event listener to start.');
            document.addEventListener(okLoadEvent, start, true);
        }

        function start(event) {

            // Check if we were called as an event handler.
            if (event && typeof event === 'object') {
                log.info('Load event:', event);
                log.info('Removing our start event listener.');

                // Remove thyself, to avoid running more than once.
                event.currentTarget.removeEventListener(event.type, start, true);
            }

            if (state.initialized) {
                log.warn('We tried to initialize more than once.');
                return;
            }

            ui.show();

            // Pay attention to when the user loses and regains
            // their network connection.
            network.init();

            addEventListener('keyup', events.onKeyUp, true);

            // Detect support for the (relatively new) speech synthesis API.
            if (has.speechSynthesis) {
                speech.init();
            }
            else {
                log.warn('This platform does not support native speech synthesis.');
            }

            state.initialized = true;
            exportPublicApi();
        }
    }
);
