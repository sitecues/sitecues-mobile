// Get a string of any currently selected text.
// It will be an empty string if there is none.
const get = () => {
    return getSelection().toString();
};

export default {
    get
};
