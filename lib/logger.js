"use strict";

function createLogger(config) {
    function logArgs() {
        var args = arguments;
        process.nextTick(function() {
            console.log.apply(console, args);
        });
    }

    function logResult(r, action) {
        var err = r.error;

        // We're all good. Log outcome and exit.
        if (!err) {
            logArgs(`${r.id}: ${ action }`);
            logArgs(r);
            return;
        }

        // These are well understood error paths.
        // They shouldn't trigger error messages.
        // Log and exit.
        if (err.noConfig || err.prMerged || err.raceCondition || err.aborted) {
            logArgs(`${r.id}: ${ action } (${err.message})`);
            return;
        }

        // Those are real issues.
        // Log in details
        logArgs(`${r.id}: ${ action } (${err.name}: ${err.message})`);
        if (r.errorRenderingErrorMsg) {
            logArgs(`    Additionally, triggered the following error while attempting to render the error msg to the client:
    errorRenderingErrorMsg.name}: ${r.errorRenderingErrorMsg.message}`);
        }
        if (err.data) { logArgs(err.data) };
        if (err.stack && config.displayStackTraces) { logArgs(err.stack) };
        logArgs(r);
    }

    return { logArgs, logResult };
}

module.exports = createLogger;