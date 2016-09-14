import tabStorage from './tab-storage';
import uuid from './uuid';

const namespace = 'session';

/*
 * Get a session from tab storage. Returns an object representing the session.
 */
const getAll = () => {
    const existingSession = tabStorage.getAll()[namespace];
    return Object.assign({}, existingSession);
};

/*
 * Save a session in tab storage. Takes in the data used to represent the session.
 * Will overwrite any existing session.
 */
const setAll = (input) => {
    tabStorage.set({
        [namespace] : input
    });
};

/*
 * Merge some new data into the existing session, with the
 * new data taking precedence.
 */
const set = (input) => {
    const existingSession = getAll();
    setAll(Object.assign({}, existingSession, input));
};

/*
 * Get the current session ID from tab storage.
 */
const getId = () => {
    return getAll().id;
};

/*
 * Return the current session if one exists.
 * Otherwise create a new session.
 */
const create = () => {
    const existingSession = getAll();

    if (existingSession.id) {
        return existingSession;
    }

    const newSession = Object.assign(existingSession, {
        id : uuid()
    });

    set(newSession);

    return newSession;
};

export default {
    getId,
    create
};
