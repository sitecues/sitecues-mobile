// This file is responsible for ensuring that the sitecues namespace conforms
// to the specification we expect from our customers. This is particularly
// useful during development scenarios, when setting up a realistic
// implementation would unecessarily slow people down.
// It also helps

if (!window.sitecues || typeof window.sitecues !== 'object') {
    window.sitecues = {};
}

var sitecues = window.sitecues;

if (!sitecues.config || typeof sitecues.config !== 'object') {
    sitecues.config = {};
}

if (!sitecues.config.siteId) {
    sitecues.config.siteId = '';
}

if (!sitecues.config.scriptUrl) {
    sitecues.config.scriptUrl = '';
}
