// This module is responsible for creating audio snippets of synthetic speech.

import state from './state';
import log from './log';

let { voices } = state;

// TODO: This probably belongs in a "util" or "common" module.
// Get a string of any currently selected text.
// It will be an empty string if there is none.
const getSelectedText = () => {
    return getSelection().toString();
};

const getVoices = () => {
    // Promise handler for when loading voices is asynchronous.
    const waitForVoices = (resolve, reject) => {
        // At least one voice has loaded asynchronously.
        // We don't know if/when any more will come in,
        // so it is best to consider the job done here.
        const onVoicesChanged = (event) => {
            // Give the available voices as the result.
            resolve(speechSynthesis.getVoices());
            // Remove thyself.
            event.currentTarget.removeEventListener(event.type, onVoicesChanged, true);
        };

        speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

        // Handle timeouts so we don't wait forever in any case where
        // the voiceschanged event never fires.
        const onTimeout = () => {
            reject(new Error(
                'Timed out asking for voices. Maybe the system doesn\'t have any?'
            ));
        };
        setTimeout(
            onTimeout,
            3000
        );
    };

    // If we have voices cached, return those.
    if (voices.length > 0) {
        return Promise.resolve(voices);
    }

    // Tickle the browser with a feather to get it to actually load voices.
    // In some environments this happens synchronously and we can use the
    // result right away. In others, it returns an empty array and we will
    // take care of that during the voiceschanged event.
    const latestVoices = speechSynthesis.getVoices();

    // If the browser has voices available right now, return those.
    // Safari gets voices synchronously, so will be true there.
    if (latestVoices.length > 0) {
        return Promise.resolve(latestVoices);
    }

    // If the current browser gives us an empty voice list, it may just
    // mean that an asynchronous load of voices is not complete.
    // As recently as Chrome 44, this happens in a very annoying way:
    // You must call speechSynthesis.getVoices() to trigger the loading
    // of voices, but it returns a useless empty array synchronously,
    // with no option for a callback or promise value. We must then
    // listen to the 'voiceschanged' event to determine when at least
    // one voice is ready. Who knows when they all are! Grrr.
    else if (typeof speechSynthesis.addEventListener === 'function') {
        return new Promise(waitForVoices);
    }

    // In theory, a platform could support the synthesis API but not
    // have any voices available, or all existing voices could
    // suddenly be uninstalled. No such situation has been
    // encountered, but we try to take care of that here.
    return Promise.reject(
        new Error('The system appears to have no voices.')
    );
};

const toggle = (cue) => {
    const cueType = typeof cue;

    // Default cue.
    if (cueType === 'undefined' || (cue && cueType !== 'string')) {
        cue = 'Speech ' + (state.speechOn ? 'off' : 'on') + ' .';
    }

    // If there is a cue, speak it regardless of the current on/off state.
    if (cue) {
        forceSpeak(cue);
    }

    // Reverse the current on/off polarity.
    state.speechOn = !state.speechOn;

    return state.speechOn;
};

// Turn speech on or off, but without saying outloud that we are doing so.
const toggleSilently = () => {
    return toggle(false);
};

const getBestVoice = () => {
    let result = 0;

    const len = voices.length;
    for (let i = 0; i < len; i += 1) {
        // We prefer Google US English above all else. So if we find it, no need to continue.
        if (voices[i].name === 'Google US English') {
            result = i;
            break;
        }
        // Ava is our backup. So if we find it, then use it. But keep searching.
        if (voices[i].name === 'Ava') {
            result = i;
        }
    }

    result = voices[result];

    return result;
};

// Turn text into speech.
const speak = (text, option) => {
    const config = Object.assign(
        {
            voice : getBestVoice()
        },
        option
    );

    const { voice, force, polite } = config;

    const speechApi = window.speechSynthesis;

    // TODO: Replace this poor execuse for a speech dictionary.
    text = text.replace(/sitecues/gi, 'sightcues');

    if (!speechApi || !text) {
        return;
    }

    if (!state.speechOn && !force) {
        return;
    }

    // By default, we are rude and interrupt any currently playing speech.
    if (!polite) {
        log.info('Speaking rudely.');
        // Immediately discontinue any currently playing speech.
        stop();
    }

    log.info('Speaking with:', voice.name);

    const speech = new SpeechSynthesisUtterance(text);
    speech.voice = voice;
    // Note: Some voices do not support altering these settings.
    // TODO: Support multiple languages.
    speech.lang = 'en-US';
    // speech.voiceURI = 'native';
    // speech.volume = 1;  // float from 0 to 1, default is 1
    // speech.rate   = 1;  // float from 0 to 10, default is 1
    // speech.pitch  = 1;  // float from 0 to 2, default is 1
    // speech.text   = text;  // the text to be spoken

    // Event listeners...

    // speech.addEventListener('start', function onSpeechStart(event) {
    //     log.info('Began speech.');
    //     log.info(Object.getOwnPropertyNames(event));
    // });
    // speech.addEventListener('end', function onSpeechEnd(event) {
    //     log.info('Finished in ' + event.elapsedTime + ' seconds.');
    //     log.info(Object.getOwnPropertyNames(event));
    // });
    // speech.addEventListener('error', function onSpeechError(event) {
    //     log.info('Speech error.');
    //     log.info(Object.getOwnPropertyNames(event));
    // });
    // speech.addEventListener('pause', function onSpeechPause(event) {
    //     log.info('Speech was paused.');
    //     log.info(Object.getOwnPropertyNames(event));
    // });
    // speech.addEventListener('resume', function onSpeechResume(event) {
    //     log.info('Speech has resumed from a paused state.');
    //     log.info(Object.getOwnPropertyNames(event));
    // });
    // speech.addEventListener('boundary', function onSpeechBoundary(event) {
    //     log.info('Encountered a word or sentence boundary.');
    //     log.info(Object.getOwnPropertyNames(event));
    // });
    // speech.addEventListener('mark', function onSpeechMark(event) {
    //     log.info('Encountered an SSML mark tag.');
    //     log.info(Object.getOwnPropertyNames(event));
    // });

    speechApi.speak(speech);
};

// "Polite" mode means wait your turn and let others finish speaking.
// It adds speech to the queue and does not play it immediately.
const politeSpeak = (text, option) => {
    const config = Object.assign({}, option, {
        polite : true
    });
    speak(text, config);
};

// "Force" mode means to speak regardless of the current on/off state
// that normally controls whether speech is allowed to play.
// Be a punk, break the rules!
const forceSpeak = (text, option) => {
    const config = Object.assign({}, option, {
        force : true
    });
    speak(text, config);
};

// Yes, it is possible to force something politely. Speech can be
// playing even if our speech system is considered to be "off".
// This adds speech to the queue regardless of
const forcePoliteSpeak = (text, option) => {
    const config = Object.assign({}, option, {
        polite : true,
        force  : true
    });
    speak(text, config);
};

const speakSelectedText = () => {
    const selectedText = getSelectedText();
    if (selectedText) {
        log.info('Detected mouse up and selected text, about to speak:', selectedText);
        speak(selectedText);
    }
    else {
        log.info('Detected mouse up, but no selected text.');
    }
    // return selectedText;
};

const stop = () => {
    // It is safe to call cancel() regardless of whether speech is
    // currently playing. Checking beforehand would be wasteful.
    speechSynthesis.cancel();
};

const onVoicesChanged = (event) => {
    log.info('New voices have been loaded!');
    log.info('Event:', event);

    // Since the browser has told us the available voices have changed,
    // we now update our storage of the voice list.
    cacheVoices();
};

const onUnload = () => {
    // Local speech synthesis behaves as a queue of audio snippets and
    // continues to play across page loads, which users do not expect.
    // This stops that from happening.
    stop();
    // speak('Navigating to new page.');
};

const onKeyUp = (event) => {
    // TODO: Users need a way to interrupt and stop speech at any time,
    // which we should provide via pressing almost any key.

    // TODO: Design the system to ignore typing in a text field, etc.

    // TODO: Make sure the key codes are valid for all supported platforms

    // if the key is 's' (as in speech).
    if (event.keyCode === 83) {
        toggle();
    }
    // if the key is the spacebar.
    else if (event.keyCode === 32) {
        speakSelectedText();
    }
};

// Update the voice list so that all modules can see the latest voices.
const cacheVoices = (newList) => {
    if (!newList) {
        newList = speechSynthesis.getVoices();
    }

    voices = state.voices = newList;

    return voices;
};

// Set up the speech system.
const init = () => {
    // Native speech keeps playing after page navigation, and that may
    // surprise the user, so let's stop that from happening.
    addEventListener('unload', onUnload, true);

    addEventListener('keyup', onKeyUp, true);

    // Prune and populate new voices as the system is updated.
    speechSynthesis.addEventListener('voiceschanged', onVoicesChanged, true);

    // This module is only considered initialized when at least one
    // voice has been loaded.
    return getVoices()
        .then(cacheVoices)
        .then(() => {
            forceSpeak('sitecues is ready.');
            // Listen for events that indicate there may be a text selection, so we can speak them.
            addEventListener('mouseup', speakSelectedText, true);
        });
};

export {
    toggle,
    toggleSilently,
    speak,
    politeSpeak,
    forceSpeak,
    forcePoliteSpeak,
    init
};
