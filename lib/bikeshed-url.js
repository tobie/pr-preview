"use strict";
var urlencode = require("urlencode");

module.exports = function bikeshedUrl(config, commit) {
    let url = `https://raw.githubusercontent.com/${ commit.repo.owner.login }/${ commit.repo.name }/${ commit.sha }/${ config.src_file}`;
    let params = Object.keys(config.bikeshed_parameters || {}).map(k => `${ k }=${ urlencode(config.bikeshed_parameters[k]) }`).join("&");
    params = params ? "&" + params : "";
    return `https://api.csswg.org/bikeshed/?url=${ urlencode(url) }${ params }`;
}