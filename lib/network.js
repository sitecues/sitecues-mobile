define(
    [
        'state',
        'audio/speech'
    ],
    function (state, speech) {

        var speak  = speech.speak,
            result = {};

        function onFirstOffline(event) {

            // This event handler determines behavior when our application detects
            // the first instance of losing internet.

            speak('Internet connectivity has been lost.');
            // remove thyself...
            event.currentTarget.removeEventListener(event.type, onFirstOffline, true);
        }

        function onOffline(event) {

            // This event handler determines behavior when our application detects
            // a loss of internet connectivity.

            // first, keep track of state in case other modules are ignorant...
            state.online = false;
            // generate speech locally, etc...
            // useLocalAudio();
        }

        function onFirstOnline(event) {

            // This event handler determines behavior when our application detects
            // the first instance of re-connecting to the internet.

            speak('Internet connectivity re-established.');
            // remove thyself...
            event.currentTarget.removeEventListener(event.type, onFirstOnline, true);
        }

        function onOnline(event) {

            // This event handler determines behavior when our application detects
            // a loss of internet connectivity.

            // first, keep track of state in case other modules are ignorant...
            state.online = true;
            // re-configure so speech can be used from our servers if desired...
            // useNetworkAudioIfWanted();
        }

        function init() {
            addEventListener('offline', onFirstOffline, true);
            addEventListener('offline', onOffline, true);
            addEventListener('online', onFirstOnline, true);
            addEventListener('online', onOnline, true);
        }

        result.init = init;

        return result;
    }
);
