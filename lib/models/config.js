"use strict";
const GH_API = require("../GH_API");

const validator = require("tv4").freshApi();
const schema = require("./config-schema.json");

function markError(err) {
    err.noConfig = true;
    return err;
}

class Config {
    constructor(pr) {
        this.pr = pr;
    }

    request() {
        return this.pr.request(GH_API.GET_CONFIG_FILE).then(file => {
            if (file.type != "file") {
                throw markError(new Error(".pr-preview.json is not a file."));
            }
            var json = JSON.parse(new Buffer(file.content, "base64").toString("utf8"));
            Config.validate(json);
            console.log("Found repo config file", json);
            return Config.override(json);
        }, err => { throw markError(err); });
    }
}

module.exports = Config;
module.exports.validate = function(config) {
    let result = validator.validateResult(config, schema);
    if (!result.valid) throw markError(result.error);
};

module.exports.override = function(config) {
    if (config.type.toLowerCase() == "respec") {
        config.params = config.params || {};
        config.params.isPreview = true;
    }
    return config;
};
