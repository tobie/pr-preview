"use strict";
const Head = require("./branch").Head;
const Base = require("./branch").Base;
const MergeBase = require("./branch").MergeBase;
const SpecDiff = require("./spec-diff");
const Config = require("./config");
const GithubAPI = require("../github-api");
const GH_API = require("../GH_API");

class PR {
    constructor(id, installation) {
        if (typeof id != "string") {
            throw new TypeError(`Incorrect Id: ${ JSON.stringify(id, null, 4) }`)
        }
        
        if (typeof installation != "object") {
            throw new TypeError(`Incorrect Installation object: ${ JSON.stringify(installation, null, 4) }`)
        }
        
        this._id = id;
        this._installation = installation;
        let parts = id.split("/");
        this._owner = parts[0];
        this._repo = parts[1];
        this._number = parts[2];
    }
    
    get head() {
        return this._head = this._head || Head.fromPR(this);
    }
    
    get base() {
        return this._base = this._base || Base.fromPR(this);
    }
    
    get merge_base() {
        if (!("_merge_base" in this)) {
            throw new Error("Invalid state");
        }
        return this._merge_base; 
    }

    set merge_base(merge_base) {
        return this._merge_base = merge_base;
    }
    
    get diff() {
        return this._diff = this._diff || new SpecDiff(this.head, this.merge_base);
    }
    
    init(options) {
        return this.setupApi(options)
            .then(_ => this.requestConfig())
            .then(_ => this.requestPR())
            .then(_ => this.requestMergeBase());
    }
   
    request(url, options, body) {
        return this._api.request(url, options, body);
    }

    requestPR() {
        return this.request(GH_API.GET_PR).then(payload => this.payload = payload);
    }
    
    setupApi(options) {
        this._api = new GithubAPI(this, options);
        return this._api.requestAuthHeaders()
            .then(headers => this._api.setAuthHeaders(headers));
    }
    
    requestConfig() {
        return new Config(this).request().then(config => this.config = config);
    }
    
    get config() {
        if (!("_config" in this)) {
            throw new Error("Invalid state");
        }
        return this._config; 
    }
    
    get postProcessingConfig() {
        return this.config.post_processing;
    }
    
    set config(config) {
        return this._config = config;
    }
    
    requestCommits() {
        return this.request(GH_API.GET_PR_COMMITS).then(commits => this.commits = commits);
    }
    
    requestMergeBase() {
        return this.request(GH_API.GET_COMPARE_COMMITS, {
            base: this.payload.base.sha,
            head: this.head.sha
        }).then(payload => {
            this.merge_base = new MergeBase({
                pr:     this,
                owner:  this.owner,
                repo:   this.repo,
                branch: this.payload.base.ref,
                sha:    payload.merge_base_commit.sha
            });
            this.files = payload.files;
        });
    }
    
    get commits() {
        if (!("_commits" in this)) {
            throw new Error("Invalid state");
        }
        return this._commits; 
    }
    
    set commits(commits) {
        return this._commits = commits;
    }

    get files() {
        if (!("_files" in this)) {
            throw new Error("Invalid state");
        }
        return this._files; 
    }
    
    set files(files) {
        return this._files = files;
    }
    
    updateBody(content) {
        return this.request(GH_API.PATCH_PR, null, {
            body: content,
            maintainer_can_modify: this.payload.maintainer_can_modify
        });
    }

    get payload() {
        return this._payload;
    }
        
    set payload(payload) {
        return this._payload = payload;
    }

    get installation() {
        return this._installation;
    }
    
    get number() {
        return this._number;
    }
    
    get owner() {
        return this._owner;
    }
    
    get repo() {
        return this._repo;
    }
    
    get id() {
        return this._id;
    }
    
    get body() {
        return this._body = this._body || (this.payload.body || "").replace(/\r\n/g, "\n").trim();
    }
    
    get processor() {
        return this.config.type.toLowerCase();
    }

    requiresPreview() {
        return !(/<!--\s*no preview\s*-->/.test(this.body));
    }
    
    touchesSrcFile() {
        return this.files.some(f => f.filename == this.config.src_file);
    }
    
    cacheAll() {
        return Promise.all([this.head.cache(), this.merge_base.cache()])
            .then(_ => this.diff.cache());
    } 
}

module.exports = PR;