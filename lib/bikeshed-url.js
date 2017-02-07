"use strict";

module.exports = function bikeshedUrl(config, head) {
    let url = `https://raw.githubusercontent.com/${ head.repo.owner.login }/${ head.repo.name }/${ head.sha }/${ config.src_file}`;
    let params = Object.keys(config.bikeshed_parameters || {}).map(k => `${ k }=${ config.bikeshed_parameters[k] }`).join("&");
    params = params ? "&" + params : "";
    return `https://api.csswg.org/bikeshed/?url=${ url }${ params }`;
}