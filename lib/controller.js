"use strict";
const PR = require("./models/pr");
const ViewBody = require("./views/body");

class Controller {
    constructor(options) {
        this.currently_running = new Set();
        this.renderer = new ViewBody();
        this.options = options;
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
