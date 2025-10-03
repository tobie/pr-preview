"use strict";

function isInternalError(error) {
    return error.noConfig || error.prMerged || error.raceCondition || error.aborted;
}

module.exports = { isInternalError };