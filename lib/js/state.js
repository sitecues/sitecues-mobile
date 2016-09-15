// Internal, canonical representation of application-wide state.
const _state = {
    initialized : false,
    speechOn    : false
};
// The public facade for our internal storage.
const state = {};

Object.defineProperties(state, {
    // One-way switch that is flipped when sitecues starts.
    initialized : {
        enumerable : true,
        get() {
            return Boolean(_state.initialized);
        },
        set() {
            if (!_state.initialized) {
                _state.initialized = true;
            }
        }
    },
    // Whether or not speech is enabled.
    speechOn : {
        enumerable : true,
        get() {
            return Boolean(_state.speechOn);
        },
        set(value) {
            _state.speechOn = Boolean(value);
        }
    },
    // Last known coordinates of the mouse. Used by dragging logic.
    mousePosition : {
        enumerable : true,
        value      : Object.seal({
            x : null,
            y : null
        })
    }
});

export default state;
