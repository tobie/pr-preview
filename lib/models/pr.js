"use strict";
const Head = require("./branch").Head;
const Base = require("./branch").Base;
const MergeBase = require("./branch").MergeBase;
const SpecDiff = require("./spec-diff");
const File = require("./file");
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
   
    init(options) {
        return this.setupApi(options)
            .then(_ => this.requestConfig())
            .then(_ => this.requestPR())
            .then(_ => this.requestMergeBase())
            .then(_ => this.getPreviewFiles());
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
            head: this.payload.head.sha
        }).then(payload => {
            this.merge_base_sha = payload.merge_base_commit.sha;
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

    get merge_base_sha() {
        if (!("_merge_base_sha" in this)) {
            throw new Error("Invalid state");
        }
        return this._merge_base_sha;
    }
    
    set merge_base_sha(merge_base_sha) {
        return this._merge_base_sha = merge_base_sha;
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
    
    get preview_files() {
        if (!("_preview_files" in this)) {
            throw new Error("Invalid state");
        }
        return this._preview_files; 
    }
    
    set preview_files(preview_files) {
        return this._preview_files = preview_files;
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
        let relFiles = this.relevantSrcFiles;
        return this.files.some(f => relFiles.indexOf(f.filename) > -1);
    }
    
    get relevantSrcFiles() {
        return [this.config.src_file];
    }
    
    getPreviewFiles() {
        this.preview_files = [ new File(this) ];
        return Promise.resolve();
    }
    
    cacheAll() {
        function next(files) {
            if (files.length) {
                let file = files.pop();
                return file.cache().then(_ => next(files));
            }
        }

        return next(this.preview_files.slice(0));
    } 
}

module.exports = PR;