// The core module is the main entry point of our application.
// It launches the initial user experience.

import log from './log';
import state from './state';
import has from './has';
import speech from './audio/speech';
import network from './network';
import keys from './keys';
import ui from './ui/main';
import domEvent from './dom-event';
import publicApi from './public-api';

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
    const siteIdRegex = /s;id=(s-[a-zA-Z0-9]{8})\//;
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

const onDocReady = (evt) => {
    // Check if we were called as an event handler.
    if (evt && typeof evt === 'object') {
        log.info('Load event:', evt);
    }

    if (state.initialized) {
        log.warn('Initialized more than once.');
        return;
    }

    keys.init();

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

    ui.init();

    state.initialized = true;

    publicApi.init();
};

const init = () => {
    // We may initialize based on these document states.
    const okReadyStates = [
        'interactive',
        'loaded',
        'complete'
    ];

    if (okReadyStates.includes(document.readyState)) {
        onDocReady();
    }
    else {
        domEvent.once(document, 'DOMContentLoaded', onDocReady);
    }
};

export default init;
