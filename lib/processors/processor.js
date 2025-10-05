"use strict";

const mustache = require("mustache");
const urlencode = require("urlencode");
const fetchUrl = require("../fetch-url");
const postProcessor = require("../post-processor");

class Processor {
    getServiceUrl() {
        throw new Error("Must implement getServiceUrl()");
    }

    getService() {
        throw new Error("Must implement getService()");
    }

    getUrl(githubUrl, options) {
        throw new Error("Must implement getUrl()");
    }

    async processFiles(head) {
        var url = this.getUrl(head.github_url, head.urlOptions());
        console.log(`Fetch: ${ url }`);
        var postProcess = postProcessor(head.pr.postProcessingConfig) || postProcessor.noop;
        return fetchUrl(url, this.getService()).then(postProcess);
    }

    static buildQuery(data, prefix, encode) {
        let params = data.config.params || {};
        let str = Object.keys(params).map(k => {
            if (!Array.isArray(params[k])) {
                params[k] = [params[k]];
            }

            return params[k].map(value => {
                let tmpl = String(value);
                let v = mustache.render(tmpl, data);
                return `${ k }=${ encode ? urlencode(v) : v }`;
            }).join("&");
        }).join("&");

        if (str.length > 0) return prefix + str;
        return str;
    }
}

module.exports = Processor;