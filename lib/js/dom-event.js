const defaultOption = {
    capture : true,
    passive : true
};

const on = (target, type, cb, option) => {
    const config = Object.assign(defaultOption, option);

    // TODO: Remove this and rename cb to listener when native "once" option gets better support.
    // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
    const listener = config.once ?
        function (event) {
            cb.apply(this, arguments);
            event.currentTarget.removeEventListener(event.type, listener, config);
        } :
        cb;

    return target.addEventListener(type, listener, config);
};

const once = (target, type, listener, option) => {
    const config = Object.assign({}, option, {
        once : true;
    });

    return on(target, type, listener, config);
};

const off = (target, type, listener, option) => {
    const config = Object.assign(defaultOption, option);

    return target.removeEventListener(type, listener, config);
};


export {
    on,
    once,
    off
};
