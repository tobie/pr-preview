"use strict";
const PR = require("./models/pr");
const Head = require("./models/branch").Head;
const ViewBody = require("./views/body");
const ViewError = require("./views/error");
const Config = require("./models/config");
const github = require("simple-github");
const { isInternalError } = require("./utils/error-utils");

class Controller {
    constructor() {
        this.currently_running = new Set();
        this.previewer_cache = new Map();
        this.renderer = new ViewBody();
        this.errorRenderer = new ViewError();
        this.queue = [];
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

    async getUrl(params) {
        let regex = /^[a-z0-9-_]+$/i;
        let owner = params.owner.trim();
        let repo = params.repo.trim();
        if (!regex.test(owner) || !regex.test(repo)) {
            throw new TypeError("Invalid repo or owner name");
        }
        let config = JSON.parse(params.config);
        Config.validate(config);
        
        const headers = await require("./auth")(false);
        const prs = await github({
            headers: headers
        }).request("GET /repos/:owner/:repo/pulls?state=all&per_page=1", {
            repo: repo,
            owner: owner,
            limit: 1
        });
        
        if (!prs.length) {
            throw new Error(`No pull requests to test with on ${owner}/${repo}. Sorry!`);
        }
        
        let pr = new PR(`${ prs[0].base.repo.full_name }/${ prs[0].id }`, { id: -1 });
        pr.payload = prs[0];
        pr.config = config;
        let h = Head.fromPR(pr);
        
        await this.testUrl(h.github_url);
        const url = await h.getUrl(h.urlOptions());
        
        // cache stuff to make pr request faster
        this.setCache(params, pr);
        return url;
    }

    async pullRequestUrl(params) {
        let url = this.getCache(params);
        if (url) return url;
        await this.getUrl(params);
        return this.getCache(params);
    }

    async testUrl(url) {
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
        this.queueJob({
            installation_id: payload.installation.id,
            id:              `${payload.pull_request.base.repo.full_name}/${payload.number}`,
            forcedUpdate:    !!force
        });
    }
    
    queueJob(job) {
        job.needsUpdate = undefined;
        job.updated = false;
        job.config = undefined;
        this.queue.push(job);
    }
    
    async processQueue(callback, errorCallback) {
        if (this.queue.length) {
            const result = this.queue.shift();
            try {
                const processedResult = await this.handlePullRequest(result);
                callback(processedResult);
                this.processQueue(callback, errorCallback);
            } catch (error) {
                errorCallback(error);
                this.processQueue(callback, errorCallback);
            }
        }
    }

    async handlePullRequest(result) {
        console.log("Currently running:", [...this.currently_running]);
        if (this.currently_running.has(result.id)) {
            result.error = new Error("Race condition");
            result.error.raceCondition = true;
            return result;
        }

        let pr = new PR(result.id, { id: result.installation_id });
        this.currently_running.add(pr.id);

        try {
            await pr.init({ debug: process.env.DEBUG_SIMPLE_GITHUB == "yes" });
            result.config = pr.config;
            result.body = pr.body;
            await this.updateBody(pr, result);
        } catch (err) {
            result.error = err;
            if (err.errors) {
                err.data = { errors: err.errors };
            }
            if (this.shouldReportError(pr, result)) {
                await this.reportError(pr, result);
            }
        } finally {
            this.release(result);
        }

        if (result.requeue) {
            this.queueJob({
                installation_id: result.installation_id,
                id:              result.id,
                forcedUpdate:    result.forcedUpdate
            });
        }

        return result;
    }

    release(result) {
        this.currently_running.delete(result.id);
        return result;
    }

    needsUpdate(pr, result) {
        return pr.payload && !pr.isMerged && pr.touchesSrcFile() && (result.forcedUpdate || pr.requiresPreview());
    }

    shouldReportError(pr, result) {
        return process.env.NODE_ENV == "production" &&
            !isInternalError(result.error) &&
            this.needsUpdate(pr, result);
    }

    render(pr) {
        return this.renderer.render(pr);
    }
    
    renderError(pr, err) {
        return this.errorRenderer.render(pr, err);
    }
    
    async reportError(pr, result) {
        let newBod = this.renderError(pr, result.error);
        try {
            await pr.updateBody(newBod);
            result.errorReported = true;
        } catch (error2) {
            result.errorRenderingErrorMsg = error2;
        }
    }

    async updateBody(pr, result) {
        if (this.needsUpdate(pr, result)) {
            result.needsUpdate = true;

            await pr.cacheAll();

            // Check for changes that occurred during build
            const changeInfo = await pr.checkForChanges();

            if (changeInfo.hasCommitChanges) {
                result.requeue = true;
                const err = new Error("New commits pushed during build");
                err.aborted = true;
                throw err;
            }

            if (changeInfo.hasBodyChanges) {
                // Update the cached body to use latest content
                pr.body = changeInfo.currentBody;
                result.bodyChanged = true;
            }

            let newBod = this.render(pr);
            result.needsUpdate = pr.body != newBod.trim();
            result.content = newBod;

            if (result.needsUpdate) {
                if (process.env.NODE_ENV == "production") {
                    await pr.updateBody(newBod);
                    result.updated = true;
                } else {
                    result.updated = "Not a live run!";
                }
            }

            return result;
        }

        result.needsUpdate = false;
        return result;
    }
}

module.exports = Controller;
