const resolve = (from, to) => {
    const baseUrl = new URL(document.baseURI, location.href);

    const resolvedFrom = new URL(from, baseUrl).href;

    if (from && !to) {
        return resolvedFrom;
    }

    return new URL(to, resolvedFrom).href;
};

const parse = (url) => {
    const baseUrl = resolve(location.href, document.baseURI);
    return new URL(url, baseUrl);
};

export default {
    parse,
    resolve
};
