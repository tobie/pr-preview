"use strict";

const emuAlgify = require("emu-algify");
const noop = (body) => Promise.resolve(body);

module.exports = (config) => {
    if (config) {
        if (config.name == "emu-algify") {
            return (body) => emuAlgify(body, config.options || {});
        } else {
            throw new Error("Pre-processor config error: " + JSON.stringify(config, null, 4));
        }
    } else {
        return noop;
    }
};

module.exports.noop = noop;