"use strict";

const Processor = require('./processor');

class HtmlProcessor extends Processor {
    getServiceUrl() {
        return null;
    }

    getService() {
        return null;
    }

    getUrl(githubUrl, options) {
        return githubUrl + Processor.buildQuery(options, "?");
    }

    async processFiles(head) {
        // HTML processor doesn't need external processing
        return this.getUrl(head.github_url, head.urlOptions());
    }

}

module.exports = HtmlProcessor;