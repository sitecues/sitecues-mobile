define(
    [],
    () => {
        // Internal, canonical representation of application-wide state.
        const _state = {
            initialized : false,
            speechOn    : false,
            online      : true
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
            // Ability to reach the internet.
            online : {
                enumerable : true,
                get() {
                    return Boolean(_state.online);
                },
                set(value) {
                    _state.online = Boolean(value);
                }
            },
            // Voices used for speech synthesis.
            voices : {
                enumerable : true,
                writable   : true,
                value      : []
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

        return state;
    }
);
