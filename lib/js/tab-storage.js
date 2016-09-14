const namespace = 'sitecues';

/*
 * Overwrite the entire namespace that we use for storing data.
 * You should probably NOT use this! Prefer setAll().
 */
const setAllRaw = (dataString) => {
    sessionStorage.setItem(namespace, dataString);
};

/*
 * Get value of the entire namespace that we use for storing data.
 * You should probably NOT use this! Prefer getAll().
 */
const getAllRaw = () => {
    return sessionStorage.getItem(namespace);
};

/*
 * Get the final representation that we will put into storage.
 */
const serialize = (data) => {
    return JSON.stringify(data || {});
};

/*
 * Get the normalized representation of what was in storage.
 */
const deserialize = (dataString) => {
    return dataString ? JSON.parse(dataString) : {};
};

/*
 * Friendly API for overwriting all data we have put into storage.
 */
const setAll = (data) => {
    setAllRaw(serialize(data));
};

/*
 * Friendly API for retrieving all data we have put into storage.
 * Returns an object.
 */
const getAll = () => {
    return deserialize(getAllRaw());
};

/*
 * Merge some new data into the existing store, with the
 * new data taking precedence.
 */
const set = (input) => {
    const appData = getAll();
    setAll(Object.assign({}, appData, input));
};

export default {
    getAll,
    setAll,
    set
};
