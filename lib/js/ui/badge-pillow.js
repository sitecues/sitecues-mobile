// Return an object representing the badge pillow. The element
// is a background of sorts for the badge image. It looks like
// a cloud and serves to separate the badge from the page.
const create = () => {
    const elem = document.createElement('div');

    elem.id = 'sitecues-badge-pillow';
    elem.className = 'sitecues sitecues-badge';
    elem.style.position = 'absolute';
    elem.style.zIndex = '2147483646';
    elem.style.borderRadius = '50%';
    elem.style.background = 'rgba(255, 255, 255, 0.5)';
    elem.style.width = '100%';
    elem.style.height = '100%';
    elem.style.filter = 'blur(10px)';
    elem.style.OFilter = 'blur(10px)';
    elem.style.MsFilter = 'blur(10px)';
    elem.style.MozFilter = 'blur(10px)';
    elem.style.WebkitFilter = 'blur(10px)';
    elem.draggable = false;

    return {
        element : elem
    };
};

export default {
    create
};
