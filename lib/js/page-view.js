import uuid from './uuid';

const pageViewId = uuid();

const getId = () => {
    return pageViewId;
};

export default {
    getId
};
