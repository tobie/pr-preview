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

    logArgs(`Processing ${queue.length} items in startup queue`);

    for (const [index, item] of queue.entries()) {
        logArgs(`Processing queue item ${index + 1}/${queue.length}: ${item.id}`);

        try {
            const result = await controller.handlePullRequest(item);
            logResult(result, "startup-queue");
        } catch (error) {
            logArgs(`Failed to process queue item ${item.id}: ${error.message}`);
        }
    }

    logArgs("Startup queue processing completed");
}

module.exports = {
    parseStartupQueue,
    processStartupQueue
};