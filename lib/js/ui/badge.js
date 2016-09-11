// The badge is the visible entry point to our user interface.

import state from '../state';
import speech from '../audio/speech';
import log from '../log';
import domEvent from '../dom-event';

const { mousePosition } = state;
let badgeElement;

const onBadgeClick = () => {
    speech.toggle();
};

// Event handler for moving the badge.
const onBadgeDrag = (evt) => {
    // TODO: figure out how to prevent edges of the badge from crossing the viewport's boundaries.

    // TODO: Are there any situations in which top and/or left would be undefined?
    //       What do we do then? Maybe insert '0'.
    const current = {
        top  : parseFloat(getComputedStyle(badgeElement).top),
        left : parseFloat(getComputedStyle(badgeElement).left)
    };
    const diff = {
        y : evt.clientY - mousePosition.y,
        x : evt.clientX - mousePosition.x
    };
    badgeElement.style.top = (current.top + diff.y) + 'px';
    badgeElement.style.left = (current.left + diff.x) + 'px';

    log.info('Move by:', {
        y : diff.y,
        x : diff.x
    });

    mousePosition.x = evt.clientX;
    mousePosition.y = evt.clientY;
};

// Our mouseup handler is only attached / listening
// while the mouse is down on the badge itself.
const onMouseUp = () => {
    // Now that the mouse is up, the badge is at its destination and
    // should no longer move.
    domEvent.off(window, 'mousemove', onBadgeDrag);
};

// This event handler is attached to the badge itself and so only ever
// fires when the user definitely clicks on it. This helps performance
// and lets downstream code make assunptions about the target, etc.
const onMouseDown = (evt) => {
    domEvent.on(window, 'mousemove', onBadgeDrag);
    domEvent.once(window, 'mouseup', onMouseUp);
    // Store the position of the mouse so that
    mousePosition.x = evt.clientX;
    mousePosition.y = evt.clientY;
};

// This function is designed to return an element that will be a sibling to our
// badge image, but visually sit behind it, to act as an enhanced background.
// This is done because CSS blur filters cannot be applied only to backgrounds
// without affecting the foreground or child content, and we do not want to blur
// our badge image, but we do want a cloud effect to separate it from the page.
const createBadgePillow = () => {
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

// This function is designed to return an image element, which will be a child of the
// overall sitecues badge structure.
const createBadgeImage = () => {
    const elem = document.createElement('img');

    // TODO: Check actual image aspect ratio and ensure we don't stretch!

    elem.id = 'sitecues-badge-image';
    elem.className = 'sitecues sitecues-badge';
    elem.style.position = 'relative';
    elem.style.zIndex = '2147483647';
    elem.style.width = '100%';
    elem.style.height = '100%';
    elem.draggable = false;

    // Provide a mechanism for loading the actual image on-demand.
    const load = () => {
        // If load() was called before or a src was added manually, it
        // is possible the image is already loaded.
        if (elem.src && elem.complete) {
            return Promise.resolve(elem);
        }

        return new Promise((resolve, reject) => {
            const onComplete = (evt) => {
                if (evt.error) {
                    domEvent.off(evt.currentTarget, 'load', onComplete, { once : true });
                    reject(evt.error);
                    return;
                }
                domEvent.off(evt.currentTarget, 'error', onComplete, { once : true });
                resolve(elem);
            };

            domEvent.once(elem, 'load', onComplete);
            domEvent.once(elem, 'error', onComplete);

            const imgUrl = '//googledrive.com/host/0B18rz_WzoeJQeUZfVW9uOVoxT0U/sitecues-icon-extra-padded-x500.png';
            elem.src = state.protocol + imgUrl;
        });
    };

    return {
        element : elem,
        load
    };
};

// This function is designed to return a wrapper element to contain
// our badge image and its sibling "pillow" used for effects.
const createBadge = () => {
    const elem = document.createElement('div');
    const pillow = createBadgePillow();
    const image = createBadgeImage();

    elem.id = 'sitecues-badge';
    elem.className = 'sitecues sitecues-badge';
    elem.style.display = 'none';
    elem.style.visibility = 'hidden';
    elem.style.opacity = '0';
    elem.style.position = 'fixed';
    elem.style.zIndex = '2147483645';
    elem.style.top = '70vh';
    elem.style.left = '70vw';
    elem.style.right = '30vw';
    elem.style.bottom = '30vh';
    elem.style.height = '15vw';
    elem.style.width = '15vw';
    elem.style.transition = 'opacity 1s linear';
    elem.draggable = false;

    // Construct the rest of the structure.
    elem.appendChild(pillow.element);
    elem.appendChild(image.element);
    // Toggle speech when clicked.
    domEvent.on(elem, 'click', onBadgeClick);
    // Do the necessary work to make the badge draggable.
    domEvent.on(elem, 'mousedown', onMouseDown);

    // Provide an API for unhiding the badge on-demand.
    const show = (delay) => {
        // Allow the badge to take up space on the page.
        elem.style.display = 'block';
        // Allow the badge to receive mouse events.
        elem.style.visibility = 'visible';

        // After the delay period, start animating to visible.
        const unhideBadge = (resolve) => {
            // Event handler for 'transitionend', at this point the badge
            // is completely visible.
            const onBadgeVisible = () => {
                log.info('Done animating badge!');
                resolve();
            };

            domEvent.once(elem, 'transitionend', onBadgeVisible);
            elem.style.opacity = '1';
        };

        return new Promise((resolve) => {
            setTimeout(
                unhideBadge,
                delay || 0,
                resolve
            );
        });
    };

    const init = () => {
        // Place the badge into the DOM.
        document.body.appendChild(elem);
        return image.load()
            .then(() => {
                return show();
            });
    };

    return {
        element : elem,
        pillow,
        image,
        show,
        init
    };
};

// This function is designed to do everything necessary for setting up
// the initial user experience of the badge module.
const init = () => {
    const badge = createBadge();

    log.info('Initializing badge module.');

    // Event handlers for the badge need this reference to work.
    badgeElement = badge.element;

    return badge.init();
};

export default {
    init
};
