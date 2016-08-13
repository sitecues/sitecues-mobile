// The log system is reponsible for collecting, normalizing, and reporting
// messages that are useful to developers.

// TODO: Implement a custom label, such as:
// var label = 'sitecues message: ';

const log = (...args) => {
    return console.log(...args);
};
log.ok = log;
log.info = console.info.bind(console);
log.warn = console.warn.bind(console);

export default log;
