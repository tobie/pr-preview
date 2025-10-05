"use strict";

const Processor = require('./processor');
const services = require('../services');
const urlencode = require("urlencode");

class RespecProcessor extends Processor {
    getServiceUrl() {
        return 'https://labs.w3.org/spec-generator/';
    }

    getService() {
        return services.RESPEC;
    }

    getUrl(githubUrl, options) {
        let query = Processor.buildQuery(options, "?");
        return `https://labs.w3.org/spec-generator/?type=respec&url=${urlencode(githubUrl + query)}`;
    }


}

module.exports = RespecProcessor;