"use strict";
const Head = require("./branch").Head;
const Base = require("./branch").Base;
const MergeBase = require("./branch").MergeBase;
const SpecDiff = require("./spec-diff");
const Config = require("./config");
const GithubAPI = require("../github-api");
const GH_API = require("../GH_API");



class PR {
    constructor(payload) {
        if (!payload.pull_request) {
            throw new TypeError(`No pull_request property in ${ JSON.stringify(payload, null, 4) }`)
        }
        this._payload = payload;
        this._pr = payload.pull_request;
    }
    
    get head() {
        return this._head = this._head || new Head(this._pr.head, this);
    }
    
    get base() {
        return this._base = this._base || new Base(this._pr.base, this);
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
   
    request(url, body) {
        return this._api.request(url, body);
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
    
    set config(config) {
        return this._config = config;
    }
    
    requestCommits() {
        return this.request(GH_API.GET_PR_COMMITS).then(commits => this.commits = commits);
    }
    
    requestMergeBranch() {
        return this.request(GH_API.GET_COMPARE_COMMITS, {
            owner: this.base.owner,
            repo: this.base.repo,
            base: this.base.sha, 
            head: this.head.sha
        }).then(payload => {
            this.merge_base = new MergeBase(payload.merge_base_commit.sha, this._pr.base, this);
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
    
    requestFiles() {
        return this.request(GH_API.GET_PR_FILES).then(files => this.files = files);
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
        return this.request(GH_API.PATCH_PR, { body: content });
    }
    
    get raw() {
        return this._payload;
    }
    
    get installation() {
        return this._payload.installation;
    }
    
    get number() {
        return this._pr.number;
    }
    
    get owner() {
        return this._pr.base.repo.owner.login;
    }
    
    get repo() {
        return this._pr.base.repo.name;
    }
    
    get id() {
        return `${ this.owner }/${ this.repo }/${ this.number }`;
    }
    
    get body() {
        return this._body = this._body || (this._pr.body || "").replace(/\r\n/g, "\n").trim();
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