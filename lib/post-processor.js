"use strict";

const emuAlgify = require("emu-algify");
const webidlGrammar = require("webidl-grammar-post-processor");
const ecmarkup = require("ecmarkup");
const noop = (body) => Promise.resolve(body);

module.exports = (config) => {
    if (config) {
        if (config.name == "emu-algify") {
            return (body) => emuAlgify(body, config.options || {});
        } else if (config.name == "webidl-grammar") {
            return (body) => webidlGrammar(body, config.options || {});
        } else if (config.name == "ecmarkup") {
            return (body) => ecmarkup.build(null, _ => Promise.resolve(body), config.options || {}).then(spec => spec.toHTML());
        } else {
            throw new Error("Pre-processor config error: " + JSON.stringify(config, null, 4));
        }
    } else {
        return noop;
    }
};

module.exports.noop = noop;