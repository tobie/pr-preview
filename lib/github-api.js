"use strict";
const github = require("simple-github");
const auth = require("./auth");

class GithubAPI {
    constructor(pr, options) {
        this.pr = pr;
        this.options = options || {};
    }
    
    requestAuthHeaders() {
        return auth(this.pr.installation);
    }
    
    setAuthHeaders(headers) {
        this._gh = github({ headers: headers, debug: this.options.debug });
    }
    
    request(url, body) {
        return this._gh.request(url, this.getRequestOptions(body));
    }
    
    getRequestOptions(body) {
        let options = {
            owner: this.pr.owner,
            repo: this.pr.repo,
            number: this.pr.number
        };
        if (body) options.body = body;
        return options;
     }
}

module.exports = GithubAPI;