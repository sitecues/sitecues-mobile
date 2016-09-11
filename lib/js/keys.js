import domEvent from './dom-event';
import speech from './audio/speech';

const onKeyUp = (evt) => {
    // S as in speech.
    if (evt.key === 's') {
        speech.toggle();
    }
};

const init = () => {
    domEvent.on(window, 'keyup', onKeyUp);
};

export default {
    init
};
