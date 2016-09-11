import state from './state';
import speech from './audio/speech';
import domEvent from './dom-event';

const { speak } = speech;

// This event handler determines behavior when our application detects
// the first instance of losing internet.
const onFirstOffline = (event) => {
    speak('Internet connectivity has been lost.');
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
    domEvent.once(window, 'offline', onFirstOffline);
    domEvent.on(window, 'offline', onOffline);
    domEvent.once(window, 'online', onFirstOnline);
    domEvent.on(window, 'online', onOnline);
};

export default {
    init
};
