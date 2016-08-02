define(
    [
        'state',
        'audio/speech'
    ],
    (state, speech) => {
        const { speak } = speech;

        // This event handler determines behavior when our application detects
        // the first instance of losing internet.
        const onFirstOffline = (event) => {
            speak('Internet connectivity has been lost.');
            // Remove thyself.
            event.currentTarget.removeEventListener(event.type, onFirstOffline, true);
        };

        // This event handler determines behavior when our application detects
        // a loss of internet connectivity.
        const onOffline = () => {
            // First, keep track of state in case other modules are ignorant.
            state.online = false;
            // Generate speech locally, etc.
            // useLocalAudio();
        };

        // This event handler determines behavior when our application detects
        // the first instance of re-connecting to the internet.
        const onFirstOnline = (event) => {
            speak('Internet connectivity re-established.');
            // Remove thyself.
            event.currentTarget.removeEventListener(event.type, onFirstOnline, true);
        };

        // This event handler determines behavior when our application detects
        // a loss of internet connectivity.
        const onOnline = () => {
            // First, keep track of state in case other modules are ignorant.
            state.online = true;
            // Re-configure so speech can be used from our servers if desired.
            // useNetworkAudioIfWanted();
        };

        const init = () => {
            addEventListener('offline', onFirstOffline, true);
            addEventListener('offline', onOffline, true);
            addEventListener('online', onFirstOnline, true);
            addEventListener('online', onOnline, true);
        };

        return {
            init
        };
    }
);
