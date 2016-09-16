import url from '../url';

// The badge image is the Sitecues logo. It is a child element
// of the overall badge structure.
const create = () => {
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
            elem.src = url.resolve(imgUrl);
        });
    };

    return {
        element : elem,
        load
    };
};

export default {
    create
};
