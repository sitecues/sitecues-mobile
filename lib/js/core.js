// The core module is the main entry point of our application.
// It launches the initial user experience.

import state from './state';
import speech from './audio/speech';
import network from './network';
import ui from './ui/main';
import has from './has';
import log from './log';

const siteIdRegex = /s;id=(s-[a-zA-Z0-9]{8})\//;
const { config } = sitecues;
let { scriptUrl, protocol, siteId } = config;

// If possible, extract more useful info out of the scriptUrl string.
// But URL() throws easily, like for protocol-relative URLs. :(
try {
    // There's one case where we want it to throw an error: empty string
    // That is because it causes the URL to be treated as relative to
    // 'about:blank', which is completely unhelpful and unexpected.
    // Therefor, we pass null instead to make it throw.
    scriptUrl = new URL(config.scriptUrl || null);
}
catch (err) {
    // Still default, which is okay.
}

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
        protocol = location.protocol.startsWith('http') ?
            location.protocol :
            'https:';
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
state.siteId = siteId;
state.protocol = protocol;

const exportPublicApi = () => {
    Object.defineProperties(sitecues, {
        initialized : {
            enumerable : true,
            get() {
                return state.initialized;
            },
            set() {
                throw new Error('Assigning to sitecues.initialized is not allowed.');
            }
        }
    });
};

const onDocReady = (event) => {
    // Check if we were called as an event handler.
    if (event && typeof event === 'object') {
        log.info('Load event:', event);
        log.info('Removing our start event listener.');

        // Remove thyself, to avoid running more than once.
        event.currentTarget.removeEventListener(event.type, onDocReady, true);
    }

    if (state.initialized) {
        log.warn('Initialized more than once.');
        return;
    }

    ui.init();

    // Pay attention to when the user loses and regains
    // their network connection.
    network.init();

    // Detect support for the (relatively new) speech synthesis API.
    if (has.speechSynth) {
        speech.init();
    }
    else {
        log.warn('This platform does not support native speech synthesis.');
    }

    state.initialized = true;
    exportPublicApi();
};

const init = () => {
    // We may initialize based on these document states.
    const okReadyStates = [
        'interactive',
        'loaded',
        'complete'
    ];

    // If the document is not in an acceptable ready state,
    // then this is the event we will wait for to init.
    const okLoadEvent = 'DOMContentLoaded';

    // Actual status of the document when we run.
    const { readyState } = document;
    // Do we find the document status to be acceptable?
    const isDocReady = okReadyStates.includes(readyState);

    if (isDocReady) {
        log.info(`Document is "${readyState}". Starting.`);
        onDocReady();
    }
    else {
        log.info(`Document is "${readyState}" (unacceptable). Adding event listener to start.`);
        document.addEventListener(okLoadEvent, onDocReady, true);
    }
};

export default init;
