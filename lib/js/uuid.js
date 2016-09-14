// Taken from here (free public license): https://gist.github.com/LeverOne/1308368

/* eslint-disable no-plusplus, no-bitwise, no-empty */

const getUuid = () => {
    let uuid = '';
    let x = '';

    for (; x++ < 36;
        uuid += x * 51 & 52 ?            // if "x" is not 9 or 14 or 19 or 24
            (                            //   return a random number or 4
                x ^ 15 ?                 //     if "x" is not 15
                    8 ^ Math.random() *  //       generate a random number from 0 to 15
                    (x ^ 20 ? 16 : 4) :  //       unless "x" is 20, in which case a random number from 8 to 11
                    4                    //     otherwise 4
            ).toString(16) :
            '-'                          // in other cases (if "x" is 9,14,19,24) insert "-"
    ) {}

    return uuid;
};

export default getUuid;
