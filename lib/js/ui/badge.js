// The badge is the visible entry point to our user interface.

import state from '../state';
import log from '../log';
import domEvent from '../dom-event';
import badgePillow from './badge-pillow';
import badgeImage from './badge-image';
import menu from './menu';

const { mousePosition } = state;
let badgeElement;

const pane = menu.create();
let paneIsOpen;
const onBadgeClick = () => {
    if (paneIsOpen) {
        pane.element.remove();
    }
    else {
        pane.init();
    }
    paneIsOpen = !paneIsOpen;
};

// Event handler for moving the badge.
const onBadgeDrag = (evt) => {
    // TODO: figure out how to prevent edges of the badge from crossing the viewport's boundaries.

    // TODO: Are there any situations in which top and/or left would be undefined?
    //       What do we do then? Maybe insert '0'.
    const computedStyle = getComputedStyle(badgeElement);
    const current = {
        top  : parseFloat(computedStyle.top),
        left : parseFloat(computedStyle.left)
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

// This function is designed to return a wrapper element to contain
// our badge image and its sibling "pillow" used for effects.
const createBadge = () => {
    const elem = document.createElement('div');
    const pillow = badgePillow.create();
    const image = badgeImage.create();

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
    // Toggle the menu when clicked.
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
        show,
        init
    };
};

// This function is designed to do everything necessary for setting up
// the initial user experience of the badge module.
const init = () => {
    log.info('Initializing badge module.');

    const badge = createBadge();
    // Event handlers for the badge need this reference to work.
    badgeElement = badge.element;

    return badge.init();
};

export default {
    init
};
