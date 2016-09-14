import ws from './web-service';
import meta from './meta';
import site from './site';
import user from './user';
import session from './session';
import pageView from './page-view';

const id = {
    site     : site.getId(),
    user     : user.getId(),
    session  : session.getId(),
    pageView : pageView.getId()
};

const toMetricName = (str) => {
    const decapitalized = str[0].toLowerCase() + str.slice(1);
    const capitals = /([A-Z])/g;
    const spacers = /[-_\s]+/g;
    const dashed = decapitalized.replace(capitals, '-$1').replace(spacers, '-');

    return dashed.toLowerCase();
};

const send = (input) => {
    if (!input.name || input.name !== 'string') {
        throw new Error('A metric name is required.');
    }

    const known = {
        metricVersion : '0.1.0',
        name          : toMetricName(input.name),
        time          : Date.now(),
        pageUrl       : location.href,
        userAgent     : navigator.userAgent,
        appName       : meta.name,
        appVersion    : meta.version,
        clientLocale  : navigator.language,
        siteId        : id.site,
        userId        : id.user,
        sessionId     : id.session,
        pageViewId    : id.pageView
    };

    const data = Object.assign({}, input, known);

    if (document.referrer) {
        data.referrer = document.referrer;
    }

    return ws.post(
        `metrics/site/${data.siteId}/notify.json?name=${data.name}`,
        data
    );
};

const metric = {};

[
    'pageVisit'
].forEach((api) => {
    metric[api] = (input) => {
        return send(Object.assign({}, input, { name : api }));
    };
});

export default metric;
