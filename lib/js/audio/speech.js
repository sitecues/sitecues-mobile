define(
    [
        'state',
        'Promise',
        'log'
    ],
    function (state, Promise, log) {

        // This module is responsible for creating audio snippets of synthetic speech.

        // Exported API.
        var voices = state.voices, result = {};

        // TODO: This probably belongs in a "util" or "common" module.
        // Get a string of any currently selected text.
        // It will be an empty string if there is none.
        function getSelectedText() {
            return getSelection().toString();
        }

        function getVoices() {

            var NONE_AVAILABLE_MESSAG = 'The system appears to have no voices.',
                TIMEOUT_MESSAGE = 'Timed out asking for voices. Maybe the system doesn\'t have any?',
                latestVoices;

            // Promise handler for when loading voices is asynchronous.
            function waitForVoices(resolve, reject) {
                // At least one voice has loaded asynchronously.
                // We don't know if/when any more will come in,
                // so it is best to consider the job done here.
                function onVoicesChanged(event) {
                    // Give the available voices as the result.
                    resolve(speechSynthesis.getVoices());
                    // Remove thyself.
                    event.currentTarget.removeEventListener(event.type, onVoicesChanged, true);
                }

                speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

                // Handle timeouts so we don't wait forever in any case where
                // the voiceschanged event never fires.
                function onTimeout() {
                    reject(
                        new Error(
                            TIMEOUT_MESSAGE
                        )
                    );
                }
                setTimeout(
                    onTimeout,  // Code to run when we are fed up with waiting.
                    3000        // The browser has this long to load voices.
                );
            }

            // If we have voices cached, return those.
            if (voices.length > 0) {
                return Promise.resolve(voices);
            }

            // Tickle the browser with a feather to get it to actually load voices.
            // In some environments this happens synchronously and we can use the
            // result right away. In others, it returns an empty array and we will
            // take care of that during the voiceschanged event.
            latestVoices = speechSynthesis.getVoices();

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
                new Error(NONE_AVAILABLE_MESSAGE)
            );
        }

        function toggle(cue) {

            var cueType = typeof cue;

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
        }

        function toggleSilently() {

            // Turn speech on or off, but without saying outloud that we are doing so.

            return toggle(false);
        }

        function getBestVoice() {

            // At the moment, we assume the first voice in the list is the best
            // if we cannot find our favorite Google or OS X voices.

            // In the future, the intention is to compute the best voice based
            // on more data, such as the current document language, etc.

            var i, len, result = 0;

            len = voices.length;
            for (i = 0; i < len; i += 1) {
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
        }

        // Turn text into speech.
        function speak(text, voice, polite, force) {

            var speechApi = window.speechSynthesis,
                voiceType = typeof voice,
                voice,
                speech;

            // TODO: Replace this poor execuse for a speech dictionary.
            text = text.replace(/sitecues/gi, 'sightcues');

            if (speechApi && text && (state.speechOn || force)) {
                // By default, we are rude and interrupt any currently playing speech.
                if (!polite) {
                    log.info('Speaking rudely.');
                    // Immediately discontinue any currently playing speech.
                    stop();
                }

                if (voiceType === 'number') {
                    voice = voices[voice];
                }
                else if (!voice || voiceType !== 'object') {
                    voice = getBestVoice();
                }

                log.info('Speaking with:', voice.name);

                speech        = new SpeechSynthesisUtterance(text);
                speech.voice  = voice;
                // Note: Some voices do not support altering these settings.
                // TODO: Support multiple languages.
                speech.lang   = 'en-US';
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
            }
        }

        // "Polite" mode means wait your turn and let others finish speaking.
        // It adds speech to the queue and does not play it immediately.
        function politeSpeak(text, voice) {
            speak(text, voice, true);
        }

        // "Force" mode means to speak regardless of the current on/off state
        // that normally controls whether speech is allowed to play.
        // Be a punk, break the rules!
        function forceSpeak(text, voice) {
            speak(text, voice, undefined, true);
        }

        // Yes, it is possible to force something politely. Speech can be
        // playing even if our speech system is considered to be "off".
        // This adds speech to the queue regardless of
        function forcePoliteSpeak(text, voice) {
            speak(text, voice, true, true);
        }

        function speakSelectedText() {
            var selectedText = getSelectedText();
            if (selectedText) {
                log.info('Detected mouse up and selected text, about to speak:', selectedText);
                speak(selectedText);
            }
            else {
                log.info('Detected mouse up, but no selected text.');
            }
            // return selectedText;
        }

        function stop() {
            // It is safe to call cancel() regardless of whether speech is
            // currently playing. Checking beforehand would be wasteful.
            speechSynthesis.cancel();
        }

        function onVoicesChanged(event) {
            log.info('New voices have been loaded!');
            log.info('Event:', event);

            // Since the browser has told us the available voices have changed,
            // we now update our storage of the voice list.
            cacheVoices();
        }

        function onUnload(event) {
            // Local speech synthesis behaves as a queue of audio snippets and
            // continues to play across page loads, which users do not expect.
            // This stops that from happening.
            stop();
            // speak('Navigating to new page.');
        }

        function onKeyUp(event) {
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
        }

        // Update the voice list so that all modules can see the latest voices.
        function cacheVoices(newList) {
            if (!newList) {
                newList = speechSynthesis.getVoices();
            }

            voices = state.voices = newList;

            return voices;
        }

        // Set up the speech system.
        function init() {
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
                .then(
                    function () {
                        forceSpeak('sitecues is ready.');
                        // Listen for events that indicate there may be a text selection, so we can speak them.
                        addEventListener("mouseup", speakSelectedText, true);
                    }
                );
        }

        result.toggle           = toggle;
        result.toggleSilently   = toggleSilently;
        result.speak            = speak;
        result.politeSpeak      = politeSpeak;
        result.forceSpeak       = forceSpeak;
        result.forcePoliteSpeak = forcePoliteSpeak
        result.init             = init;

        return result;
    }
);
