import state from './state';

const init = () => {
    Object.defineProperties(sitecues, {
        initialized : {
            enumerable : true,
            get() {
                return state.initialized;
            },
            set() {
                throw new Error('Assigning to sitecues.initialized is not allowed.');
            }
        }
    });
};

export default {
    init
};
