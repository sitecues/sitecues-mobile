import speech from '../audio/speech';
import domEvent from '../dom-event';

const onIconClick = () => {
    speech.toggle();
};

const create = () => {
    const elem = document.createElement('img');

    elem.id = 'sitecues-speech-icon';
    elem.className = 'sitecues sitecues-menu';
    elem.style.position = 'relative';
    elem.style.zIndex = '2147483647';
    elem.style.width = '50%';
    elem.style.height = '50%';
    elem.draggable = false;

    elem.src = 'http://cdn.mysitemyway.com/etc-mysitemyway/icons/legacy-previews/icons/glossy-black-3d-buttons-icons-people-things/062315-glossy-black-3d-button-icon-people-things-speech.png';

    // Toggle speech when clicked.
    domEvent.on(elem, 'click', onIconClick);

    return {
        element : elem
    };
};

export default {
    create
};
