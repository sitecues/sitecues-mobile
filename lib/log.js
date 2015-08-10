define(
    [],
    function () {

        // The log system is reponsible for collecting, reporting, and
        // standardizing messages which are useful to developers.

        // TODO: Implement a custom label, such as:
        // var label = 'sitecues message: ';

        function log() {
            return console.log.apply(console, arguments);
        }
        log.ok   = log;
        log.info = console.log.bind(console);
        log.warn = console.warn.bind(console);

        return log;
    }
);
