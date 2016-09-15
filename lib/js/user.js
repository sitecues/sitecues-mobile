import storage from './storage';
import uuid from './uuid';

const namespace = 'user';

// Get a user from storage. Returns an object representing the user.
const getAll = () => {
    const existingUser = storage.getAll()[namespace];
    return Object.assign({}, existingUser);
};

// Save a user in storage. Takes in the data used to represent the user.
// Will overwrite any existing user.
const setAll = (input) => {
    storage.set({
        [namespace] : input
    });
};

// Merge some new data into the existing user, with the
// new data taking precedence.
const set = (input) => {
    const existingUser = getAll();
    setAll(Object.assign({}, existingUser, input));
};

// Get the current user ID from storage.
const getId = () => {
    return getAll().id;
};

// Return the current user if one exists.
// Otherwise create a new user.
const create = () => {
    const existingUser = getAll();

    if (existingUser.id) {
        return existingUser;
    }

    const newUser = Object.assign(existingUser, {
        id : uuid()
    });

    set(newUser);

    return newUser;
};

export default {
    getId,
    create
};
