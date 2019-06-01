"use strict";
const PR = require("./models/pr");
const Head = require("./models/branch").Head;
const ViewBody = require("./views/body");
const ViewError = require("./views/error");
const Config = require("./models/config");
const github = require("simple-github");

class Controller {
    constructor() {
        this.currently_running = new Set();
        this.previewer_cache = new Map();
        this.renderer = new ViewBody();
        this.errorRenderer = new ViewError();
    }

    setCache(params, pr) {
        let k = this.cacheKey(params);
        let c = require("urlencode")(params.config);
        let f = ".pr-preview.json";
        let pr_url = `https://github.com/${pr.owner}/${pr.repo}/new/${pr.payload.base.ref}?filename=${f}&value=${c}`;
        console.log("cache:set", k, pr_url);
        this.previewer_cache.set(k, pr_url);
    }

    cacheKey(params) {
        return `${params.owner}/${params.repo}/${params.config}`;
    }

    getCache(params) {
        let k = this.cacheKey(params);
        console.log("cache:get", k);
        return this.previewer_cache.get(k);
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
                    let pr = new PR(`${ prs[0].base.repo.full_name }/${ prs[0].id }`, { id: -1 });
                    pr.payload = prs[0];
                    pr.config = config;
                    let h = Head.fromPR(pr);
                    return this.testUrl(h.github_url)
                        .then(_ => h.getUrl(h.urlOptions()))
                        .then(url => {
                            // cache stuff to make pr request faster
                            this.setCache(params, pr);
                            return url;
                        });
                });
            });
        } catch(err) {
            return Promise.reject(err);
        }
    }

    pullRequestUrl(params) {
        let url = this.getCache(params);
        if (url) return Promise.resolve(url);
        return this.getUrl(params).then(_ => this.getCache(params));
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
    
    queuePullRequest(payload, force) {
        return this.handlePullRequest({
            installation_id: payload.installation.id,
            id:              `${payload.pull_request.base.repo.full_name}/${payload.number}`,
            forcedUpdate:    !!force,
            needsUpdate:     undefined,
            updated:         false,
            config:          undefined,
            previous:        undefined
        });
    }

    handlePullRequest(result) {
        let pr = new PR(result.id, { id: result.installation_id });
        
        console.log("Currently running:", [...this.currently_running]);
        if (this.currently_running.has(result.id)) {
            result.error = new Error("Race condition");
            result.error.raceCondition = true;
            return Promise.resolve(result);
        }
        this.currently_running.add(pr.id);
        
        return pr.init({ debug: process.env.DEBUG_SIMPLE_GITHUB == "yes" }).then(_ => {
            result.config = pr.config;
            result.body = pr.body;
            return this.updateBody(pr, result).then(_ => this.release(result));
        }).catch(err => {
            result.error = err;
            if (err.errors) {
                err.data = { errors: err.errors };
            }
            if (this.shouldReportError(pr, result)) {
                return this.reportError(pr, result).then(_ => this.release(result));
            }            
            return this.release(result);
        });
    }

    release(result) {
        this.currently_running.delete(result.id);
        return result;
    }

    needsUpdate(pr, result) {
        return pr.payload && !pr.isMerged && pr.touchesSrcFile() && (result.forcedUpdate || pr.requiresPreview());
    }

    shouldReportError(pr, result) {
        return !result.error.noConfig && process.env.NODE_ENV == "production" && this.needsUpdate(pr, result);
    }

    render(pr) {
        return this.renderer.render(pr);
    }
    
    renderError(pr, err) {
        return this.errorRenderer.render(pr, err);
    }
    
    reportError(pr, result) {
        let newBod = this.renderError(pr, result.error);
        return pr.updateBody(newBod).then(_ => {
            result.errorReported = true;
        }, error2 => {
            result.errorRenderingErrorMsg = error2;
        });
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
            });
        }
        
        result.needsUpdate = false;
        return Promise.resolve(result);
    };
}

module.exports = Controller;
