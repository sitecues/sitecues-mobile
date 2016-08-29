// The UI system is reponsible for consolidating APIs related to
// managing the user interface.
import badge from './badge';

const init = () => {
    return Promise.all([
        badge.init()
    ]);
};

export default {
    init
};
