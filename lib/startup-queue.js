"use strict";

function parseStartupQueue(startupQueueEnv, logger) {
    const { logArgs } = logger;

    if (!startupQueueEnv) {
        logArgs("No startup queue present");
        return null;
    }

    try {
        const queue = JSON.parse(startupQueueEnv);
        return queue;
    } catch (error) {
        logArgs(`Invalid JSON in STARTUP_QUEUE: ${error.message}`);
        return null;
    }
}

async function processStartupQueue(queue, controller, logger) {
    const { logArgs, logResult } = logger;

    if (!queue) {
        logArgs("No startup queue present");
        return;
    }

    if (!Array.isArray(queue)) {
        logArgs("Startup queue must be an array");
        return;
    }

    if (queue.length === 0) {
        logArgs("Startup queue is empty");
        return;
    }

    if (!queue.every(item => item && typeof item.id === "string")) {
        logArgs("Invalid queue items - all items must have a string 'id' property");
        return;
    }

    logArgs(`Queuing ${queue.length} items from startup queue`);

    // Add all items to the controller's queue
    queue.forEach(item => {
        logArgs(`Queuing startup job: ${item.id}`);
        controller.queue.push(item);
    });

    // Process the queue
    controller.processQueue(r => logResult(r, "startup-queue"), logArgs);

    logArgs("Startup queue items queued for processing");
}

module.exports = {
    parseStartupQueue,
    processStartupQueue
};