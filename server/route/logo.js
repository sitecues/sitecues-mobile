'use strict';

module.exports = {
    method  : 'GET',
    path    : '/sitecues-symbol.png',
    handler(request, reply) {
        reply.file('sitecues-symbol.png');
    }
};
