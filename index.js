"use strict";
var t0 = Date.now();
if (process.env.NODE_ENV === "dev") {
    // Load local env variables
    require("./env");
}

const createApp = require("./lib/app"),
    Controller = require("./lib/controller"),
    createLogger = require("./lib/logger"),
    { parseStartupQueue, processStartupQueue } = require("./lib/startup-queue");

const controller = new Controller();

var config = {
    githubSecret: process.env.GITHUB_SECRET,
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV,
    displayStackTraces: process.env.DISPLAY_STACK_TRACES === "yes"
};

const { logArgs, logResult } = createLogger(config);

const queue = parseStartupQueue(process.env.STARTUP_QUEUE, { logArgs, logResult });
if (queue) {
    processStartupQueue(queue, controller, { logArgs, logResult }).catch(error => {
        logArgs(`Unexpected error during startup queue processing: ${error.message}`);
    });
}

var app = createApp(controller, config);
var port = config.port;
app.listen(port, function() {
    console.log("Express server listening on port %d in %s mode", port, app.settings.env);
    console.log("App started in", (Date.now() - t0) + "ms.");
});
