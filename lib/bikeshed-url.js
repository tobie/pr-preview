"use strict";

module.exports = function bikeshedUrl(config, commit) {
    let url = `https://raw.githubusercontent.com/${ commit.repo.owner.login }/${ commit.repo.name }/${ commit.sha }/${ config.src_file}`;
    let params = Object.keys(config.bikeshed_parameters || {}).map(k => `${ k }=${ config.bikeshed_parameters[k] }`).join("&");
    params = params ? "&" + params : "";
    return `https://api.csswg.org/bikeshed/?url=${ url }${ params }`;
}