"use strict";

const cache = require("../cache");
const request = require("request");
const urlencode = require("urlencode");
const mustache = require("mustache");
const postProcessor = require("../post-processor");
const fetchUrl = require("../fetch-url");
const services = require("../services");

mustache.escape = v => v;

module.exports = (superclass) => class extends superclass {
    getUrl(options) {
        if (this.pr.processor == "bikeshed") {
            return { method: "post", url: this.getBikeshedUrl(options) };
        }

        if (this.pr.processor == "respec") {
            return this.getRespecUrl(options);
        }

        if (this.pr.processor == "html") {
            return this.getHtmlUrl(options);
        }

        throw new Error(`Unknown processor ${ this.pr.processor }`);
    }

    getService() {
        if (this.pr.processor == "bikeshed") {
            return services.BIKESHED;
        }

        if (this.pr.processor == "respec") {
            return services.RESPEC;
        }

        return null;
    }

    getBikeshedUrl(data) {
        let query = this.getQuery(data, "&", true);
        return `https://api.csswg.org/bikeshed/?url=${ urlencode(this.github_url) }${ query }`;
    }

    getRespecUrl(data) {
        let query = this.getQuery(data, "?");
        return `https://labs.w3.org/spec-generator/?type=respec&url=${urlencode(this.github_url + query)}`
    }

    getHtmlUrl(data) {
        return this.github_url + this.getQuery(data, "?");
    }

    get file_path() {
        return `${ this.owner }/${ this.repo }/${ this.sha }/${ this.pr.config.src_file }`;
    }

    get github_url() {
        return `https://raw.githubusercontent.com/${ this.file_path }`;
    }

    get github_repo_url() {
        return `https://raw.githubusercontent.com/${ this.owner }/${ this.repo }/${ this.sha }/`;
    }

    getQuery(data, prefix, encode) {
        let params = this.pr.config.params || {};
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

    urlOptions() {
        return {
            config:       this.pr.config,
            pull_request: this.pr.payload,
            owner:        this.owner,
            repo:         this.repo,
            branch:       this.ref,
            sha:          this.sha,
            short_sha:    this.short_sha,
            url:          this.cache_url
        };
    }

    fetch() {
        var url = this.getUrl(this.urlOptions());
        console.log(`Fetch: ${ url }`);
        var postProcess = postProcessor(this.pr.postProcessingConfig) || postProcessor.noop;
        return fetchUrl(url, this.getService()).then(postProcess);
    }
};
