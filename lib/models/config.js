"use strict";
const GH_API = require("../GH_API");

const validator = require("tv4").freshApi();
const schema = require("./config-schema.json");

function markError(err) {
    err.noConfig = true;
    return err;
}

let Config = {};

Config.request = function(pr) {
    return pr.request(GH_API.GET_CONFIG_FILE).then(file => {
        if (file.type != "file") {
            throw markError(new Error(".pr-preview.json is not a file."));
        }
        var json = JSON.parse(new Buffer(file.content, "base64").toString("utf8"));
        Config.validate(json);
        console.log("Found repo config file", json);
        return Config.desugar(json);
    }, err => { throw markError(err); });
};

Config.validate = function(config) {
    let result = validator.validateResult(config, schema);
    if (!result.valid) throw markError(result.error);
};

// Expands shorthand useful for single-build repositories or repositories with
// shared configuration into the full format for later processing.
//
// Any fields not specified in the per-spec config will be taken from the global
// config instead.
Config.desugar = function({specs, src_file, ...config}) {
    const desugaredSpecs = (specs || [{src_file}]).map(
        spec => Config.addDefault(Object.assign({}, config, spec)));
    return {specs: desugaredSpecs};
};

Config.addDefault = function(config) {
    config.type = config.type.toLowerCase();
    if (config.type == "respec") {
        if (!config.params || !("isPreview" in config.params)) {
            config.params = config.params || {};
            config.params.isPreview = true;
        }
    } else if (config.type == "bikeshed") {
        if (!config.params) {
            config.params = config.params || {};
        }
        if (!("md-warning" in config.params) && config.params["md-status"] !== "LS-PR") {
            // See https://github.com/tobie/pr-preview/issues/55 for why LS-PR is special-cased.
            config.params["md-warning"] = "not ready";
        }
    } else if (config.type == "wattsi") {
        if (!("multipage" in config)) {
            config.multipage = true;
        }
    } else if (config.type == "html") {
        // No build step
    }
    return config;
};

module.exports = Config;
