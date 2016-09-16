// This module is responsible for creating audio snippets of synthetic speech.

import state from '../state';
import textSelect from '../text-select';
import domEvent from '../dom-event';

const getVoices = () => {
    // Promise handler for when loading voices is asynchronous.
    const waitForVoices = (resolve, reject) => {
        const onTimeout = () => {
            reject(new Error('Unable find voices to speak with.'));
        };

        // Don't wait forever in case the voiceschanged event never fires.
        const voicesTimeout = setTimeout(onTimeout, 3000);

        // At least one voice has loaded asynchronously. We don't know if/when
        // any more will come in, so it is best to consider the job done here.
        const onVoicesChanged = () => {
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
    const voices = speechSynthesis.getVoices();

    // If the browser has voices available right now, return those.
    // Safari gets voices synchronously, so will be true there.
    if (voices.length > 0) {
        return Promise.resolve(voices);
    }

    // If the browser gave us an empty voice list, it may mean that an async
    // load of voices is not yet complete. At least Chrome 44 does this in a
    // very annoying way: we must call speechSynthesis.getVoices() to begin
    // loading voices, but it returns a useless empty array synchronously,
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
        new Error('Timed out getting voices. The system may not have any.')
    );
};

// Based on a given set of voices and locale restrictions, get sitecues'
// favorite voice. We want to sound the best.
const getBestVoice = (option) => {
    const { voices, locale } = option;
    const [lang] = locale.split('-');

    const acceptableVoices = voices.filter((voice) => {
        const voiceLocale = voice.lang;
        // Allow universal speech engines that support many locales. These exist on Windows.
        if (!voiceLocale) {
            return true;
        }
        return voiceLocale === lang || voiceLocale.startsWith(lang + '-');
    });

    const compareVoices = (one, two) => {
        const oneLocale = one.lang;
        const twoLocale = two.lang;

        // Prefer voices with the perfect accent (or lack thereof).
        if (oneLocale === locale && twoLocale !== locale) {
            return -1;
        }
        if (twoLocale === locale && oneLocale !== locale) {
            return 1;
        }

        // Prefer to respect the user's default voices.
        if (one.default && !two.default) {
            return -1;
        }
        if (two.default && !one.default) {
            return 1;
        }

        // Prefer voices without an accent, to avoid mapping one accent to
        // another if at all possible.
        if (oneLocale === lang && twoLocale !== lang) {
            return -1;
        }
        if (twoLocale === lang && oneLocale !== lang) {
            return 1;
        }
    };

    if (acceptableVoices.length > 0) {
        return acceptableVoices.sort(compareVoices)[0];
    }

    throw new Error('No voice available for ' + locale);
};

// Stop speech. This method is idempotent and always safe to call.
// eslint-disable-next-line no-shadow
const stop = () => {
    speechSynthesis.cancel();
};

// Turn text into speech.
const speak = (input, option) => {
    const config = Object.assign({}, option);
    const { force, polite } = config;
    // TODO: Replace this poor excuse for a speech dictionary.
    const text = input.replace(/sitecues/gi, 'sightcues').trim();

    let prom = Promise.resolve();

    if (!text || (!state.speechOn && !force)) {
        return prom;
    }

    // Interrupt speech, rather than letting Web Speech add it to the queue.
    if (!polite) {
        stop();
    }

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

    // If and when we have a voice to use, finish setting up
    // and then play speech.
    return prom.then(() => {
        return new Promise((resolve, reject) => {
            const speech = new SpeechSynthesisUtterance(text);
            speech.voice = voice;
            speech.lang = locale;
            // NOTE: Some voices do not support these settings and will break silently!
            // speech.volume = 1;  // float from 0 to 1, default is 1
            // speech.rate   = 1;  // float from 0 to 10, default is 1
            // speech.pitch  = 1;  // float from 0 to 2, default is 1

            const onComplete = (evt) => {
                if (evt.error) {
                    domEvent.off(evt.currentTarget, 'end', onComplete, { once : true });
                    reject(evt.error);
                    return;
                }
                domEvent.off(evt.currentTarget, 'error', onComplete, { once : true });
                resolve(evt);
            };

            domEvent.once(speech, 'end', onComplete);
            domEvent.once(speech, 'error', onComplete);

            // Other interesting events: 'resume', 'boundary', 'mark'

            speechSynthesis.speak(speech);
        });
    });
};

// "Polite" mode means wait your turn and let others finish speaking.
// It adds speech to the queue and does not play it immediately.
const politeSpeak = (input, option) => {
    const config = Object.assign({}, option, {
        polite : true
    });
    return speak(input, config);
};

// "Force" mode means to speak regardless of whether speech is enabled.
const forceSpeak = (input, option) => {
    const config = Object.assign({}, option, {
        force : true
    });
    return speak(input, config);
};

// Yes, it is possible to force something politely. Speech can be
// playing even if our speech system is considered to be "off".
// This force adds speech to the queue.
const forcePoliteSpeak = (option) => {
    const config = Object.assign({}, option, {
        polite : true,
        force  : true
    });
    return speak(config);
};

const speakSelectedText = () => {
    speak(textSelect.get());
};

// Web Speech keeps playing across page loads, which is jarring.
// This prevents that from happening.
const onUnload = () => {
    stop();
    // speak('Navigating to new page.');
};

const onKeyDown = (evt) => {
    // Spacebar.
    if (evt.key === ' ') {
        speakSelectedText();
        evt.preventDefault();
    }
    else {
        stop();
    }
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
        domEvent.on(window, 'keydown', onKeyDown, { passive : false });
        // Mouseup indicates there may be a text selection, so we can speak them.
        domEvent.on(window, 'mouseup', speakSelectedText);
        // Native speech keeps playing after page navigation, and that may
        // surprise the user, so let's stop that from happening.
        domEvent.once(window, 'unload', onUnload);
    }
    else {
        domEvent.off(window, 'keydown', onKeyDown, { passive : false });
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

export default {
    toggle,
    toggleSilently,
    speak,
    politeSpeak,
    forceSpeak,
    forcePoliteSpeak
};
