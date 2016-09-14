const apiBaseUrl = 'https://ws.sitecues.com/sitecues/api/';

const post = (route, data) => {
    return fetch(apiBaseUrl + route, {
        method : 'POST',
        body   : JSON.stringify(data)
        // These headers are more semantically correct, but they
        // trigger a "non-simple" CORS request.
        // headers : {
        //     Accept         : 'application/json',
        //     'Content-Type' : 'application/json'
        // }
    });
};

export default {
    post
};
