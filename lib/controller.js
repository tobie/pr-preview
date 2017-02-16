"use strict";
const PR = require("./models/pr");
const ViewBody = require("./views/body");
const Config = require("./models/config");
const github = require("simple-github");

class Controller {
    constructor(options) {
        this.currently_running = new Set();
        this.renderer = new ViewBody();
        this.options = options;
    }
    
    getUrl(params) {
        try {
            let regex = /^[a-z0-9-_]+$/i;
            let owner = params.owner.trim();
            let repo = params.repo.trim();
            if (!regex.test(owner) || !regex.test(repo)) {
                throw new TypeError("Invalid repo or owner name");
            }
            let config = JSON.parse(params.config);
            Config.validate(config);
            return require("./auth")(false).then(headers => {
                return github({
                    headers: headers
                }).request("GET /repos/:owner/:repo/pulls?state=all&per_page=1", {
                    repo: repo,
                    owner: owner,
                    limit: 1
                }).then(prs => {
                    if (!prs.length) {
                        throw new Error(`No pull requests to test with on ${owner}/${repo}. Sorry!`);
                    }
                    let pr = new PR({ pull_request: prs[0] });
                    pr.config = config;
                    return this.testUrl(pr.head.github_url)
                        .then(_ => pr.head.getUrl());
                });
            });
        } catch(err) {
            return Promise.reject(err);
        }
    }
    
    testUrl(url) {
        return new Promise((resolve, reject) => {
            require("request")({ url: url, method: "head" }, (err, response) => {
                if (err) { return reject(err); }
                if (response.statusCode != 200) {
                    return reject(new Error(`${response.statusCode} ${response.statusMessage} for ${url}.`));
                }
                resolve();
            });
        });
    }
    
    handlePullRequest(payload, force) {
        let pr = new PR(payload, this.options);
        let result = {
            installation_id: payload.installation.id,
            id:              pr.id,
            forcedUpdate:    !!force,
            needsUpdate:     undefined,
            updated:         false,
            config:          undefined,
            previous:        pr.body
        };
        
        console.log("Currently running:", [...this.currently_running]);
        if (this.currently_running.has(result.id)) {
            result.error = new Error("Race condition");
            return Promise.resolve(result);
        }
        this.currently_running.add(pr.id);
        
        return pr.setupApi().then(_ => {
            return pr.requestConfig().then(config => {
                result.config = config;
                return pr.requestFiles().then(_ => {
                    return this.updateBody(pr, result).then(result => this.release(result));
                });
            });
        }).catch(error => {
            this.release(result);
            result.error = error;
            return result;
        });
    }

    release(result) {
        this.currently_running.delete(result.id);
        return result;
    }
    
    needsUpdate(pr, result) {
        return pr.touchesSrcFile() && (result.force || pr.requiresPreview());
    }
    
    render(pr) {
        return this.renderer.render(pr)
    }
    
    updateBody(pr, result) {
        if (this.needsUpdate(pr, result)) {
            result.needsUpdate = true;
            return pr.cacheAll().then(_ => {
                let newBod = this.render(pr);
                result.needsUpdate = pr.body != newBod.trim();
                result.content = newBod;
                if (result.needsUpdate) {
                    if (process.env.NODE_ENV == "production") {
                        return pr.updateBody(newBod).then(_ => {
                            result.updated = true
                            return result;
                        });
                    } else {
                        result.updated = "Not a live run!";
                    }
                }
                return result;
            }).catch(err => {
                result.error = err;
                return result;
            });
        }
        result.needsUpdate = false;
        return Promise.resolve(result);
    };
}

module.exports = Controller;
