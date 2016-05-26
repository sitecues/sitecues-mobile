define(
    [
        'state',   // application-wide knowledge sharing
        'audio/speech',
        'network',
        'ui',
        'has',      // feature detection
        'log'
    ],
    function (state, speech, network, ui, has, log) {

        // The core module is the main entry point of our application.
        // It launches the initial user experience.

        // We may initialize based on these document states.
        var okReadyStates = [
                'interactive', // DOM is ready, page is usable, like addEventListener('DOMContentLoaded' ...)
                'loaded',
                'complete'     // images are ready, like addEventListener('load' ...)
            ],
            // If the document is not in an acceptable ready state,
            // then this is the event we will wait for to start.
            okLoadEvent = 'DOMContentLoaded',
            // Actual status of the document when we run.
            readyState  = document.readyState,
            // Do we find the document status to be acceptable?
            isReady     = okReadyStates.indexOf(readyState) >= 0,
            siteIdRegex = /s;id=(s-[a-zA-Z0-9]{8})\//,
            config      = sitecues.config,  // This is gauranteed to exist by namespace.js
            scriptUrl   = config.scriptUrl,
            protocol    = config.protocol,
            siteId      = config.siteId;

        // If possible, extract more useful info out of the scriptUrl string.
        // But URL() throws easily, like for protocol-relative URLs. :(
        try {
            // There's one case where we want it to throw an error: empty string
            // That is because it causes the URL to be treated as relative to
            // 'about:blank', which is completely unhelpful and unexpected.
            // Therefor, we pass undefined instead to make it throw.
            scriptUrl = new URL(config.scriptUrl || undefined);
        }
        catch (err) {}  // still default, which is okay

        // Figure out a reasonable protocol to use for any network requests.
        if (!protocol || typeof protocol !== 'string') {
            // If we were able to parse the original URL used to retrieve
            // this file, then use that.
            if (scriptUrl && typeof scriptUrl === 'object') {
                protocol = scriptUrl.protocol;
            }
            // If the page is using a flavor of HTTP, use exactly that.
            // Otherwise, assume HTTPS for enhanced security.
            if (!protocol) {
                protocol = location.protocol.indexOf('http') === 0 ?
                    location.protocol                              :
                    'https:'
            }
        }

        // Figure out which site / customer is using the library.
        if (!siteId || typeof siteId !== 'string') {
            siteId = (scriptUrl.pathname || scriptUrl).match(siteIdRegex);
            if (siteId) {
                // Use the capturing group to find the actual Site ID.
                siteId = siteId[1];
            }
            // Give up.
            if (!siteId) {
                siteId = '';
            }
        }

        // Save computed configuration for later use in other modules.
        state.siteId   = siteId;
        state.protocol = protocol;

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

            ui.init();

            // Pay attention to when the user loses and regains
            // their network connection.
            network.init();

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

        // TODO: Where should this function live? Probably not here.
        //       It's also not really a "utility" or common helper.
        function exportPublicApi() {

            // Public interfaces.

            Object.defineProperties(sitecues, {
                initialized : {
                    enumerable : true,
                    get : function () {
                        return state.initialized;
                    },
                    set : function () {
                        throw new Error('Assigning to sitecues.initialized is not allowed.');
                    }
                }
            });
        }
    }
);
