"use strict";
var urlencode = require("urlencode");
var mustache = require("mustache");
mustache.escape = v => v;

/*
  The data parameter is an object with the following fields:
  {
    config:       config object
    pull_request: the pull request payload as received through GH's API
    owner:        owner's login (for the particular tip we're building a URL for)
    repo:         repo's name (see above)
    branch:       branch name (see above)
    sha:          duh (see above)
    short_sha:    sha truncated to 7 characters
  }
*/

module.exports = function bikeshedUrl(data) {
    let url = `https://raw.githubusercontent.com/${ data.owner }/${ data.repo }/${ data.sha }/${ data.config.src_file}`;
    let params = Object.keys(data.config.bikeshed_parameters || {}).map(k => {
        let v = mustache.render(data.config.bikeshed_parameters[k], data);
        return `${ k }=${ urlencode(v) }`
    }).join("&");
    params = params ? "&" + params : "";
    return `https://api.csswg.org/bikeshed/?url=${ urlencode(url) }${ params }`;
}