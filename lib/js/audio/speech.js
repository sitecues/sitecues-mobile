// This module is responsible for creating audio snippets of synthetic speech.

import state from '../state';
import log from '../log';
import textSelect from '../text-select';
import domEvent from '../dom-event';

let { voices } = state;

const getVoices = () => {
    // Promise handler for when loading voices is asynchronous.
    const waitForVoices = (resolve, reject) => {
        // Don't wait forever in case the voiceschanged event never fires.
        const onTimeout = () => {
            reject(new Error(
                'Timed out getting voices. The system may not have any.'
            ));
        };

        const voicesTimeout = setTimeout(onTimeout, 3000);
        // At least one voice has loaded asynchronously. We don't know if/when
        // any more will come in, so it is best to consider the job done here.
        const onVoicesChanged = (event) => {
            clearTimeout(voicesTimeout);
            // Give the available voices as the result.
            resolve(speechSynthesis.getVoices());
        };

        domEvent.once(speechSynthesis, 'voiceschanged', onVoicesChanged);
    };

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

    // If the browser gave us an empty voice list, it may mean that an async
    // load of voices is not yet complete. At least Chrome 44 does this in a
    // very annoying way. We must run speechSynthesis.getVoices() to trigger
    // voice loading, but it returns a useless empty array synchronously,
    // with no option for a callback or promise. We must then listen to the
    // 'voiceschanged' event to determine when at least one voice is ready.
    // Who knows when they all are! Grrr. See errata 11 in the spec:
    // https://dvcs.w3.org/hg/speech-api/raw-file/tip/speechapi-errata.html
    else if (typeof speechSynthesis.addEventListener === 'function') {
        return new Promise(waitForVoices);
    }

    // In theory, a platform could support the synthesis API but not have any
    // voices available. Or all the voices could suddenly be uninstalled.
    // We have not encountered that, but we try to take care of it here.
    return Promise.reject(
        new Error('The system seems to have no voices.')
    );
};

const toggle = (option) => {
    const config = Object.assign(
        {
            cue : 'Speech ' + (state.speechOn ? 'off' : 'on') + ' .'
        },
        option
    );

    // If there is a cue, speak it regardless of the current on/off state.
    if (config.cue) {
        forceSpeak(config.cue);
    }

    // Reverse the current on/off polarity.
    state.speechOn = !state.speechOn;

    if (state.speechOn) {
        domEvent.on(window, 'keyup', onKeyUp);
        // Mouseup indicates there may be a text selection, so we can speak them.
        domEvent.on(window, 'mouseup', speakSelectedText);
        // Native speech keeps playing after page navigation, and that may
        // surprise the user, so let's stop that from happening.
        domEvent.once(window, 'unload', onUnload);
    }
    else {
        domEvent.off(window, 'keyup', onKeyUp);
        domEvent.off(window, 'mouseup', speakSelectedText);
        domEvent.off(window, 'unload', onUnload, { once : true });
    }

    return state.speechOn;
};

// Turn speech on or off, but without saying outloud that we are doing so.
const toggleSilently = (option) => {
    const config = Object.assign({}, option, {
        cue : null
    });
    return toggle(config);
};

// Based on a given set of voices and locale restrictions, get sitecues'
// favorite voice. We want to sound the best.
const getBestVoice = (option) => {
    const { voices, locale } = option;
    const [lang] = locale.split('-');

    const acceptableVoices = voices.filter((voice) => {
        const voiceLocale = voice.lang;
        // Allow universal speech engines, which exist on Windows. These can
        // speak just about any language.
        if (!voiceLocale) {
            return true;
        }
        return voiceLocale === lang || voiceLocale.startsWith(lang + '-');
    });

    if (acceptableVoices.length < 1) {
        throw new Error('No local voice available for ' + locale);
    }

    const compareVoices = (a, b) => {
        const aLocale = a.lang;
        const bLocale = b.lang;

        // Prefer voices with the perfect accent (or lack thereof).
        if (aLocale === locale && bLocale !== locale) {
            return -1;
        }
        if (bLocale === locale && aLocale !== locale) {
            return 1;
        }

        // Prefer to respect the user's default voices.
        if (a.default && !b.default) {
            return -1;
        }
        if (b.default && !a.default) {
            return 1;
        }

        // Prefer voices without an accent, to avoid mapping one accent to
        // another if at all possible.
        if (aLocale === lang && bLocale !== lang) {
            return -1;
        }
        if (bLocale === lang && aLocale !== lang) {
            return 1;
        }
    };

    return acceptableVoices.sort(compareVoices)[0];
};

// Turn text into speech.
const speak = (text, option) => {
    const config = Object.assign({}, option);

    const { force, polite } = config;

    let prom = Promise.resolve();

    if (!text.trim() || (!state.speechOn && !force)) {
        return prom;
    }

    // By default, the Web Speech API queues up synthesis requests.
    // But this is typically not what is desired by sitecues.
    if (!polite) {
        // Immediately discontinue any currently playing speech.
        stop();
    }

    // TODO: Support multiple languages.
    const locale = 'en-US';

    let { voice } = config;

    if (!voice) {
        prom = getVoices()
            .then((voices) => {
                return getBestVoice({
                    voices,
                    locale
                });
            })
            .then((bestVoice) => {
                voice = bestVoice;
            });
    }

    log.info('Speaking with:', voice.name);

    const speech = new SpeechSynthesisUtterance(text);
    speech.voice = voice;
    speech.lang = locale;
    // Note: Some voices do not support altering these settings.
    // speech.voiceURI = 'native';
    // speech.volume = 1;   // float from 0 to 1, default is 1
    // speech.rate = 1;     // float from 0 to 10, default is 1
    // speech.pitch = 1;    // float from 0 to 2, default is 1

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

    // When and if we have a voice to use, finish setting up
    // and then play speech.
    return prom.then(() => {
        return new Promise((resolve, reject) => {
            const { onStart } = option;

            const removeListeners = () => {
                domEvent.off(speech, 'start', onStart, { once : true });
                domEvent.off(speech, 'end', onSpeechEnd, { once : true });
                domEvent.off(speech, 'error', onSpeechError, { once : true });
            };

            const onSpeechEnd = () => {
                removeListeners();
                resolve();
            };

            const onSpeechError = (event) => {
                removeListeners();
                reject(event.error);
            };

            if (typeof onStart === 'function') {
                domEvent.once(speech, 'start', onStart);
            }
            domEvent.once(speech, 'end', onSpeechEnd);
            domEvent.once(speech, 'error', onSpeechError);

            speechSynthesis.speak(speech);
        });
    });
};

// "Polite" mode means wait your turn and let others finish speaking.
// It adds speech to the queue and does not play it immediately.
const politeSpeak = (text, option) => {
    const config = Object.assign({}, option, {
        polite : true
    });
    return speak(text, config);
};

// "Force" mode means to speak regardless of the current on/off state
// that normally controls whether speech is allowed to play.
// Be a punk, break the rules!
const forceSpeak = (text, option) => {
    const config = Object.assign({}, option, {
        force : true
    });
    return speak(text, config);
};

// Yes, it is possible to force something politely. Speech can be
// playing even if our speech system is considered to be "off".
// This adds speech to the queue regardless of
const forcePoliteSpeak = (text, option) => {
    const config = Object.assign({}, option, {
        polite : true,
        force  : true
    });
    return speak(text, config);
};

// Stop speech. This method is idempotent. It does not matter if we are
// currently playing or not.
const stop = () => {
    speechSynthesis.cancel();
};

// Local speech synthesis behaves as a queue of audio snippets and
// continues to play across page loads, which users do not expect.
// This stops that from happening.
const onUnload = () => {
    stop();
    // speak('Navigating to new page.');
};

const onKeyUp = (event) => {
    // TODO: Design the system to ignore typing in a text field, etc.

    // Spacebar.
    if (event.key === ' ') {
        speakSelectedText();
    }
    else {
        stop();
    }
};

const speakSelectedText = () => {
    speak(textSelect.get());
};

// Set up the speech system.
const init = () => {
    return forceSpeak('sitecues is ready.');
};

export default {
    toggle,
    toggleSilently,
    speak,
    politeSpeak,
    forceSpeak,
    forcePoliteSpeak,
    init
};
