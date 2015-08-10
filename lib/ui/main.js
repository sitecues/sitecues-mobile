define(
    [
        'state',
        'audio/speech',
        'log'
    ],
    function (state, speech, log) {

        // The UI system is reponsible for consolidating APIs
        // related to managing the user interface.

        var mousePosition = state.mousePosition,
            badge;

        function onBadgeClick() {
            speech.toggle();
        }

        function onMouseDown(event){
            addEventListener('mousemove', moveBadge, true);
            addEventListener('mouseup', onMouseUp, true);
            // Store the position of the mouse so that
            mousePosition.x = event.clientX;
            mousePosition.y = event.clientY;
        }

        function onMouseUp(event) {
            removeEventListener('mousemove', moveBadge, true);
            // Remove thyself.
            event.currentTarget.removeEventListener(
                event.type, onMouseUp, true
            );
        }

        function onBadgeDrag(event) {

            // Event handler for moving the badge.

            // TODO: figure out how to prevent edges of the badge from crossing the viewport's boundaries.

            log.info('Moved badge:', event);

            // todo: if top and/or left are undefined then set '0'
            badge.style.top = (parseFloat(getComputedStyle(badge).top) + event.clientY - mousePosition.y) + 'px';
            badge.style.left = (parseFloat(getComputedStyle(badge).left) + event.clientX - mousePosition.x) + 'px';

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

        function createBadgeWrapper() {

            // This function is designed to return a wrapper element to contain
            // our badge image and its sibling used for effects.

            var elem = document.createElement('div'),
                result = elem;

            // TODO Finish this up...

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

            return result;
        }

        function createBadgePillow() {

            // This function is designed to return an element that will be a sibling to our
            // badge image, but visually sit behind it, to act as an enhanced background.
            // This is done because CSS blur filters cannot be applied only to backgrounds
            // without affecting the foreground or child content, and we do not want to blur
            // our badge image, but we do want a cloud effect to separate it from the page.

            var elem = document.createElement('div'),
                result = elem;

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

            return result;
        }

        function createBadgeImage() {

            // This function is designed to return an image element, which will be a child of the
            // overall sitecues badge structure.

            var elem = document.createElement('img'),
                result = elem;

            // TODO: Check actual image aspect ratio and ensure we don't stretch!

            elem.id             = 'sitecues-badge-image';
            elem.className      = 'sitecues sitecues-badge';
            elem.style.position = 'relative';
            elem.style.zIndex   = '2147483647';  // we will sit at the uppermost layer
            elem.style.width    = '100%';
            elem.style.height   = '100%';
            elem.src            = state.protocol + '//googledrive.com/host/0B18rz_WzoeJQeUZfVW9uOVoxT0U/sitecues-icon-extra-padded-x500.png';
            elem.draggable      = false;  // we handle dragging ourselves with event listeners

            return result;
        }

        function createBadge() {

            var badge  = createBadgeWrapper(),  // top of the structure
                pillow = createBadgePillow(),   // fancy background effect
                image  = createBadgeImage(),    // sitecues symbol
                result = badge;

            badge.appendChild(pillow);
            badge.appendChild(image);

            badge.addEventListener('click', onBadgeClick);
            // Do the necessary work to make the badge draggable.
            badge.addEventListener('mousedown', onMouseDown, true);

            return result;
        }

        function attachBadge(badge, anchor) {

            if (!badge || typeof badge !== 'object') {
                badge = getBadgeElement();
            }
            if (!anchor || typeof anchor !== 'object') {
                anchor = document.querySelector('body');
            }

            anchor.appendChild(badge);

            return badge;
        }

        function showBadge(elem) {

            var elemType = typeof elem;

            if (!elem) {
                elem = attachBadge(createBadge());
            }
            else if (elemType === 'object' && elem.length > 0) {
                elem = elem[0];  // assume it's a collection, with the first element being our target
            }
            else if (elemType === 'string') {
                elem = document.querySelector(elem);
            }

            if (elem) {
                elem.style.display = 'block';
                elem.style.visibility = 'visible';
                setTimeout(
                    function (elem) {
                        elem.style.opacity = '1';
                    },
                    0,    // delay
                    elem  // argument for callback
                );
            }

            return elem;
        }

        function show() {

            var badge  = createBadge(),
                result = badge;

            log.info('Showing user interface.');

            attachBadge(badge);
            showBadge(badge);

            // todo: return 'undefined' if there is no element is ready to use.
            return result;
        }

        return {
            show : show
        };
    }
);
