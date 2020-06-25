"use strict";
const github = require("simple-github");
const auth = require("./auth");

class GithubAPI {
    constructor(pr, options) {
        this.pr = pr;
        this.options = options || {};
    }
    
    requestAuthHeaders() {
        return auth(this.pr.installation, { debug: this.options.debug });
    }
    
    setAuthHeaders(headers) {
        this._gh = github({ headers: headers, debug: this.options.debug });
    }
    
    request(url, options, body) {
        return this._gh.request(url, this.getRequestOptions(options, body));
    }
    
    getRequestOptions(_options, body) {
        _options = _options || {};
        let options = {
            owner: this.pr.owner,
            repo: this.pr.repo,
            number: this.pr.number
        };
        for (var k in _options) {
            options[k] = _options[k];
        }
        if (body) {
            options.body = body;
        }
        return options;
     }
}

module.exports = GithubAPI;