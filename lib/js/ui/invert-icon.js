import domEvent from '../dom-event';
import invert from '../invert';

const onIconClick = () => {
    invert.toggle();
};

const create = () => {
    const elem = document.createElement('img');

    elem.id = 'sitecues-invert-icon';
    elem.className = 'sitecues sitecues-menu';
    elem.style.position = 'relative';
    elem.style.zIndex = '2147483647';
    elem.style.width = '50%';
    elem.style.height = '50%';
    elem.draggable = false;

    elem.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Yin_yang.svg/220px-Yin_yang.svg.png';

    // Toggle speech when clicked.
    domEvent.on(elem, 'click', onIconClick);

    return {
        element : elem
    };
};

export default {
    create
};
