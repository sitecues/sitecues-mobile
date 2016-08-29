import domEvent from './dom-event';
import speech from './audio/speech';

const onKeyUp = (event) => {
    // S as in speech.
    if (event.key === 's') {
        speech.toggle();
    }
};

const init = () => {
    domEvent.on(window, 'keyup', onKeyUp);
};

export default {
    init
};
