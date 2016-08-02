// The log system is reponsible for collecting, reporting, and
// standardizing messages which are useful to developers.

define(
    [],
    () => {
        // TODO: Implement a custom label, such as:
        // var label = 'sitecues message: ';

        const log = (...args) => {
            return console.log(...args);
        };
        log.ok = log;
        log.info = console.info.bind(console);
        log.warn = console.warn.bind(console);

        return log;
    }
);
