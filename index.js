"use strict";
var t0 = Date.now();
if (process.env.NODE_ENV === "dev") {
    // Load local env variables
    require("./env");
}

const createApp = require("./lib/app"),
    Controller = require("./lib/controller"),
    createLogger = require("./lib/logger");

const controller = new Controller();

var config = {
    githubSecret: process.env.GITHUB_SECRET,
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV,
    displayStackTraces: process.env.DISPLAY_STACK_TRACES === "yes"
};

const { logArgs, logResult } = createLogger(config);

const STARTUP_QUEUE = process.env.STARTUP_QUEUE;
if (STARTUP_QUEUE) {
    try {
        let queue = JSON.parse(STARTUP_QUEUE);
        if (queue && queue.length && typeof queue[0].id == "string") {
            logArgs(`Processing queue : ${ STARTUP_QUEUE }`);
            function next() {
                var r = queue.pop();
                if (r) {
                    logArgs(`Processing queue : ${ r.id }`);
                    controller.handlePullRequest(r).then(r => logResult(r, "startup-queue"), logArgs).then(next);
                } else {
                    logArgs("Startup queue processed");
                }
            }
            next();
        } else {
            throw new Error();
        }
    } catch (e) {
        logArgs(`Malformed queue ${STARTUP_QUEUE}`);
    }
} else {
    logArgs("No startup queue present");
}

var app = createApp(controller, config);
var port = config.port;
app.listen(port, function() {
    console.log("Express server listening on port %d in %s mode", port, app.settings.env);
    console.log("App started in", (Date.now() - t0) + "ms.");
});
