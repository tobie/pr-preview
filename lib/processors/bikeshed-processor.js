"use strict";

const Processor = require('./processor');
const services = require('../services');
const urlencode = require("urlencode");

class BikeshedProcessor extends Processor {
    getServiceUrl() {
        return 'https://api.csswg.org/bikeshed/';
    }

    getService() {
        return services.BIKESHED;
    }

    getUrl(githubUrl, options) {
        let query = Processor.buildQuery(options, "&", true);
        return {
            method: "POST",
            url: `https://api.csswg.org/bikeshed/?url=${ urlencode(githubUrl) }${ query }`
        };
    }


}

module.exports = BikeshedProcessor;