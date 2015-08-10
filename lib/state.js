define(
    [],
    function () {

        // Internal, canonical representation of application-wide state.
        var _state = {
                initialized : false,
                speechOn    : false,
                online      : true,
                mousePosition : {
                    x : undefined,
                    y : undefined
                }
            },
            // The public facade for our internal storage.
            state = {
                // TODO: Investigate using signals instead of events.
                // See: http://millermedeiros.github.io/js-signals/
            };


        Object.defineProperties(
            state,
            {
                // One-way switch that is flipped when sitecues starts.
                initialized : {
                    enumerable : true,
                    get : function () {
                        return !!_state.initialized;
                    },
                    set : function () {
                        if (!_state.initialized) {
                            _state.initialized = true;
                        }
                    }
                },
                // Whether or not speech is enabled.
                speechOn : {
                    enumerable : true,
                    get : function () {
                        return !!_state.speechOn;
                    },
                    set : function (value) {
                        _state.speechOn = !!value;
                    }
                },
                // Ability to reach the internet.
                online : {
                    enumerable : true,
                    get : function () {
                        return !!_state.online;
                    },
                    set : function (value) {
                        _state.online = !!value;
                    }
                },
                // Voices used for speech synthesis.
                voices : {
                    enumerable : true,
                    writable   : true
                },
                // Last known coordinates of the mouse. Used by dragging logic.
                mousePosition : {
                    enumerable : true,
                    value      : Object.seal({
                        x : undefined,
                        y : undefined
                    })
                }
            }
        );

        return state;
    }
);
