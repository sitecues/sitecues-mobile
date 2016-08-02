// This module is for feature detection. It is preferable to User Agent sniffing, etc.
// At some point, we will probably include a full-blown library for this.
// See: https://github.com/phiggins42/has.js/

// For now, we do it ourselves to provide an API surface to get started with.
define(
    [],
    () => {
        const speechSynth = Boolean(
            // Constructor for creating speech fragments.
            typeof SpeechSynthesisUtterance === 'function' &&
            // Player for using speech fragments.
            typeof speechSynthesis === 'object' && speechSynthesis
        );

        return {
            speechSynth
        };
    }
);
