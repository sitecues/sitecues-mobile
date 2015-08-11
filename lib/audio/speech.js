define(
    [
        'state',
        'log'
    ],
    function (state, log) {

        // This module is responsible for creating audio snippets of synthetic speech.

        // Exported API.
        var voices = state.voices, result = {};

        // Get a string of any currently selected text.
        // It will be an empty string if there is none.
        function getSelectedText() {
            return getSelection().toString();
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
            // if we cannot find out favorite Google or OS X voices.

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

            return voices[0];
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

                if (typeof voice === 'number') {
                    voice = voices[voice];
                }
                else if (!voice || typeof voice !== 'object') {
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
            if (speechSynthesis.speaking) {
                log.info('Stopping speech!');
            }
            else {
                log.info('Asked to stop speech, but there is none.');
            }

            // It is safe to call cancel() regardless of whether speech is
            // currently playing. Checking beforehand would be wasteful.
            speechSynthesis.cancel();
        }

        function onFirstVoicesChanged(event) {

            // This function is designed to run once when TTS voices
            // have been loaded by the browser and are ready to use.
            // Loading voices is asynchronous in some browsers.

            log.info('First voice loaded.', event);
            speak('sitecues is ready.');
            // Listen for events that indicate there may be a text selection, so we can speak them.
            addEventListener("mouseup", speakSelectedText, true);

            // Remove thyself, to avoid running more than once.
            event.currentTarget.removeEventListener(event.type, onFirstVoicesChanged, true);
        }

        function onVoicesChanged(event) {
            log.info('New voices have been loaded!');
            log.info('Event:', event);
            // window.speechSynthesis.getVoices();
            // TODO: log which voices are different than the current set
            // TODO: Verify that the original object at state.voices is updated
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
            // if the key is the spacebar...
            else if (event.keyCode === 32) {
                speakSelectedText();
            }
        }

        // Set up speech system.
        function init() {
            // Native speech keeps playing after page navigation, and that may
            // surprise the user, so let's stop that from happening.
            addEventListener('unload', onUnload, true);

            addEventListener('keyup', onKeyUp, true);

            // TODO: Support Safari, which does synchronous getVoices()
            //       and does not use addEventListener

            // Wait on voices to be loaded before doing anything else.
            speechSynthesis.addEventListener('voiceschanged', onFirstVoicesChanged, true);
            // Prune and populate new voices as the system is updated.
            speechSynthesis.addEventListener('voiceschanged', onVoicesChanged, true);
        }

        result.toggle         = toggle;
        result.toggleSilently = toggleSilently;
        result.speak          = speak;
        result.init           = init;

        return result;
    }
);
