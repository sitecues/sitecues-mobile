// Return a UUIDv4 string, based on this FOSS algorithm:
// https://gist.github.com/LeverOne/1308368

// Modified slightly for clarity and to pass linting.

/* eslint-disable no-plusplus, no-bitwise, no-empty */

const getUuid = () => {
    let uuid = '';
    let x = '';

    for (; x++ < 36;
        uuid += x * 51 & 52 ?
            (
                x ^ 15 ?
                    8 ^ Math.random() * (x ^ 20 ? 16 : 4) :
                    4
            ).toString(16) :
            '-'
    ) {}

    return uuid;
};

export default getUuid;
