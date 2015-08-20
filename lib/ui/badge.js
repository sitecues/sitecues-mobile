define(
    [
        'state',
        'Promise',
        'audio/speech',
        'log'
    ],
    function (state, Promise, speech, log) {

        // The UI system is reponsible for consolidating APIs
        // related to managing the user interface.

        var mousePosition = state.mousePosition,
            badgeElement;

        function onBadgeClick() {
            speech.toggle();
        }
        // This event handler is attached to the badge itself and so only ever
        // fires when the user definitely clicks on it. This helps performance
        // and lets downstream code make assunptions about the target, etc.
        function onMouseDown(event) {
            addEventListener('mousemove', onBadgeDrag, true);
            addEventListener('mouseup', onMouseUp, true);
            // Store the position of the mouse so that
            mousePosition.x = event.clientX;
            mousePosition.y = event.clientY;
        }

        // Our mouseup handler is only attached / listening
        // while the mouse is down on the badge itself.
        function onMouseUp(event) {
            // Now that the mouse is up, the badge is at its destination and
            // should no longer move.
            removeEventListener('mousemove', onBadgeDrag, true);
            // Remove thyself.
            event.currentTarget.removeEventListener(
                event.type, onMouseUp, true
            );
        }

        function onBadgeDrag(event) {

            // Event handler for moving the badge.

            // TODO: figure out how to prevent edges of the badge from crossing the viewport's boundaries.

            log.info('Moved badge:', event);

            // TODO: Are there any situations in which top and/or left would be undefined?
            //       What do we do then? Maybe insert '0'.
            badgeElement.style.top = (parseFloat(getComputedStyle(badgeElement).top) + event.clientY - mousePosition.y) + 'px';
            badgeElement.style.left = (parseFloat(getComputedStyle(badgeElement).left) + event.clientX - mousePosition.x) + 'px';

            log.info(
                'Move by:',
                {
                    'x' : event.clientX - mousePosition.x,
                    'y' : event.clientY - mousePosition.y
                }
            );

            mousePosition.x = event.clientX;
            mousePosition.y = event.clientY;
        }

        function createBadge() {

            // This function is designed to return a wrapper element to contain
            // our badge image and its sibling "pillow" used for effects.

            var elem   = document.createElement('div'),
                pillow = createBadgePillow(),  // fancy background effect
                image  = createBadgeImage(),   // sitecues symbol
                result = {};

            elem.id               = 'sitecues-badge';
            elem.className        = 'sitecues sitecues-badge';
            elem.style.display    = 'none';
            elem.style.visibility = 'hidden';
            elem.style.opacity    = '0';
            elem.style.position   = 'fixed';
            elem.style.zIndex     = '2147483645';  // we will sit 2 levels below uppermost layer
            elem.style.top        = '70vh';
            elem.style.left       = '70vw';
            elem.style.right      = '30vw';
            elem.style.bottom     = '30vh';
            // if you want to change the badge dimensions, this is the place to do so...
            elem.style.height     = '15vw';
            elem.style.width      = '15vw';
            elem.style.transition = 'opacity 1s linear';
            elem.draggable        = false;  // we handle dragging ourselves with event listeners

            // Construct the rest of the structure.
            elem.appendChild(pillow.element),  // fancy background effect
            elem.appendChild(image.element),   // sitecues symbol
            // Toggle speech when clicked.
            elem.addEventListener('click', onBadgeClick, true);
            // Do the necessary work to make the badge draggable.
            elem.addEventListener('mousedown', onMouseDown, true);


            // Provide an API for unhiding the badge on-demand.
            function show(delay) {
                if (!delay || typeof delay !== 'number' || delay < 0) {
                    delay = 0;
                }
                // Allow the badge to take up space on the page.
                elem.style.display    = 'block';
                // Allow the badge to receive mouse events.
                elem.style.visibility = 'visible';

                // After the delay period, start animating to visible.
                function unhideBadge(resolve, reject) {

                    // Event handler for 'transitionend', at this point the badge
                    // is completely visible.
                    function onBadgeVisible(event) {
                        // Remove thyself.
                        event.currentTarget.removeEventListener(event.type, onBadgeVisible, true);
                        log.info('Done animating badge!');
                        resolve(result);
                    }

                    elem.addEventListener('transitionend', onBadgeVisible, true);
                    elem.style.opacity = '1';
                }

                return new Promise(function (resolve, reject) {
                    setTimeout(
                        unhideBadge,
                        delay,    // wait time before starting to animate
                        resolve,
                        reject
                    );
                });
            }

            function init() {
                // Place the badge into the DOM.
                document.body.appendChild(elem);
                return image
                    .load()
                    .then(
                        function () {
                            return show();
                        }
                    );
            }

            result.element = elem;
            result.pillow  = pillow;
            result.image   = image;
            result.show    = show;
            result.init    = init;

            return result;
        }

        function createBadgePillow() {

            // This function is designed to return an element that will be a sibling to our
            // badge image, but visually sit behind it, to act as an enhanced background.
            // This is done because CSS blur filters cannot be applied only to backgrounds
            // without affecting the foreground or child content, and we do not want to blur
            // our badge image, but we do want a cloud effect to separate it from the page.

            var elem = document.createElement('div'),
                result = {};

            elem.id                 = 'sitecues-badge-pillow';
            elem.className          = 'sitecues sitecues-badge';
            elem.style.position     = 'absolute';  // take out of flow so we can sit under the badge image
            elem.style.zIndex       = '2147483646';  // we will sit 1 level below uppermost layer
            elem.style.borderRadius = '50%';  // make a perfect circle to mimic the badge image shape
            elem.style.background   = 'rgba(255, 255, 255, 0.5)';  // white with some transparency
            elem.style.width        = '100%';
            elem.style.height       = '100%';
            elem.style.filter       = 'blur(10px)';  // provide the luminous effect
            elem.style.OFilter      = 'blur(10px)';
            elem.style.MsFilter     = 'blur(10px)';
            elem.style.MozFilter    = 'blur(10px)';
            elem.style.WebkitFilter = 'blur(10px)';
            elem.draggable          = false;  // we handle dragging ourselves with event listeners

            // Provide a consistent API with the other badge components.
            result.element = elem;

            return result;
        }

        function createBadgeImage() {

            // This function is designed to return an image element, which will be a child of the
            // overall sitecues badge structure.

            var elem = document.createElement('img'),
                BADGE_IMAGE_SRC = '//googledrive.com/host/0B18rz_WzoeJQeUZfVW9uOVoxT0U/sitecues-icon-extra-padded-x500.png',
                result = {};

            // TODO: Check actual image aspect ratio and ensure we don't stretch!

            elem.id             = 'sitecues-badge-image';
            elem.className      = 'sitecues sitecues-badge';
            elem.style.position = 'relative';
            elem.style.zIndex   = '2147483647';  // we will sit at the uppermost layer
            elem.style.width    = '100%';
            elem.style.height   = '100%';
            elem.draggable      = false;  // we handle dragging ourselves with event listeners

            // Provide a mechanism for loading the actual image on-demand.
            function load() {

                // If load() was called before or a src was added manually, it
                // is possible the image is already loaded.
                if (elem.src && elem.complete) {
                    return Promise.resolve(elem);
                }

                return new Promise(
                    function (resolve, reject) {
                        function onLoad(event) {
                            // Remove thyself.
                            event.currentTarget.removeEventListener(event.type, onLoad, true)

                            resolve(elem);
                        }

                        elem.addEventListener('load', onLoad, true);
                        elem.src = state.protocol + BADGE_IMAGE_SRC;
                    }
                )
            }

            // Do not attach properties to the element itself. That effectively
            // pollutes the global scope and could lead to bad assumptions.
            result.element = elem;
            result.load    = load;

            return result;
        }

        // This function is designed to do everything necessary for setting up
        // the initial user experience of the badge module.
        function init() {

            var badge  = createBadge();

            log.info('Initializing badge module.');

            // Event handlers for the badge need this reference to work.
            badgeElement = badge.element;

            return badge.init();
        }

        return {
            // Expose the API for setting up the initial user experience.
            init : init
        };
    }
);
