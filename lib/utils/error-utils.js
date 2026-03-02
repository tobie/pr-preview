"use strict";

function isInternalError(error) {
    return error.noConfig || error.prMerged || error.aborted;
}

module.exports = { isInternalError };