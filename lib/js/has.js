// Feature detection. This is preferable to User Agent sniffing, etc.
// At some point, we may include a real library for this.
// See: https://github.com/phiggins42/has.js/

const speechSynth = Boolean(
    // Constructor for creating speech fragments.
    typeof SpeechSynthesisUtterance === 'function' &&
    // Player for using speech fragments.
    typeof speechSynthesis === 'object' && speechSynthesis
);

export default {
    speechSynth
};
