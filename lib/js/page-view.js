import uuid from './uuid';

const namespace = 'pageView';

// Get a page view from the config. Returns an object representing the page view.
const getAll = () => {
    const existingPageView = sitecues.config[namespace];
    return Object.assign({}, existingPageView);
};

// Save a page view for use in other apps. Takes in the data used to represent the page view.
// Will overwrite any existing page view.
const setAll = (input) => {
    sitecues.config[namespace] = Object.assign({}, input);
};

// Merge some new data into the existing page view, with the
// new data taking precedence.
const set = (input) => {
    const existingPageView = getAll();
    setAll(Object.assign({}, existingPageView, input));
};

// Get the current page view ID.
const getId = () => {
    return getAll().id;
};

// Return the current page view if one exists.
// Otherwise create a new page view.
const create = () => {
    const existingPageView = getAll();

    if (existingPageView.id) {
        return existingPageView;
    }

    const newPageView = Object.assign(existingPageView, {
        id : uuid()
    });

    set(newPageView);

    return newPageView;
};

export default {
    getId,
    create
};
