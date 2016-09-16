const invert = 'invert(100%)';
let enabled = false;

const enable = () => {
    const { style } = document.documentElement;
    const { filter } = style;
    if (!filter.includes(invert)) {
        style.filter += invert;
    }
    enabled = true;
};

const disable = () => {
    const { style } = document.documentElement;
    const { filter } = style;
    style.filter = filter.replace(invert, '');
    enabled = false;
};

const toggle = () => {
    return enabled ? disable() : enable();
};

export default {
    enable,
    disable,
    toggle
};
