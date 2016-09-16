import speechIcon from './speech-icon';
import invertIcon from './invert-icon';

const create = () => {
    const elem = document.createElement('div');
    elem.id = 'sitecues-menu';
    elem.className = 'sitecues sitecues-menu';
    // elem.style.display = ;
    elem.style.opacity = '0.9';
    elem.style.position = 'fixed';
    elem.style.zIndex = '2147483645';
    elem.style.background = '#222';
    elem.style.borderRadius = '10px';
    elem.style.top = '30vh';
    elem.style.left = '10vw';
    elem.style.right = '90vw';
    elem.style.bottom = '70vh';
    elem.style.height = '18vw';
    elem.style.width = '18vw';

    elem.innerText = 'Hello!';

    elem.appendChild(speechIcon.create().element);
    elem.appendChild(invertIcon.create().element);

    const init = () => {
        document.body.appendChild(elem);
    };

    return {
        element : elem,
        init
    };
};

export default {
    create
};
