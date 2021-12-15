"use strict";
const Config = require("./config");
const GithubAPI = require("../github-api");
const GH_API = require("../GH_API");
const SpecBuild = require("./spec-build");

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
            .then(_ => this.requestIncludes())
            .then(_ => this.requestMergeBase())
            .then(_ => this.getPreviewFiles());
    }

    request(url, options, body) {
        return this._api.request(url, options, body);
    }

    requestPR() {
        return this.request(GH_API.GET_PR).then(payload => {
            this.payload = payload;
            if (this.isMerged) {
                let err = new Error("PR is already merged.");
                err.prMerged = true;
                throw err;
            }
        });
    }

    setupApi(options) {
        this._api = new GithubAPI(this, options);
        return this._api.requestAuthHeaders()
            .then(headers => this._api.setAuthHeaders(headers));
    }

    async requestConfig() {
        this.config = await Config.request(this);
    }

    get config() {
        if (!("_config" in this)) {
            throw new Error("Invalid state, missing _config");
        }
        return this._config;
    }

    set config(config) {
        this.specs = config.specs.map(spec => new SpecBuild(this, spec));
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
            throw new Error("Invalid state, missing _commits");
        }
        return this._commits;
    }

    set commits(commits) {
        return this._commits = commits;
    }

    get head_sha() {
        return this.payload.head.sha;
    }

    get isMerged() {
        return this.payload.merged;
    }

    get merge_base_sha() {
        if (!("_merge_base_sha" in this)) {
            throw new Error("Invalid state, missing _merge_base_sha");
        }
        return this._merge_base_sha;
    }

    set merge_base_sha(merge_base_sha) {
        return this._merge_base_sha = merge_base_sha;
    }

    get files() {
        if (!("_files" in this)) {
            throw new Error("Invalid state, missing _files");
        }
        return this._files;
    }

    set files(files) {
        return this._files = files;
    }

    get preview_files() {
        if (!("_preview_files" in this)) {
            throw new Error("Invalid state, missing _preview_files");
        }
        return this._preview_files;
    }

    set preview_files(preview_files) {
        return this._preview_files = preview_files;
    }

    updateBody(content) {
        return this.request(GH_API.PATCH_PR, null, {
            body: content
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

    get aws_s3_bucket() {
        if (process.env.ALLOW_MULTIPLE_AWS_BUCKETS == "no") {
            return process.env.AWS_BUCKET_NAME;
        }
        return this.owner == "whatwg" ? process.env.WHATWG_AWS_BUCKET_NAME : process.env.AWS_BUCKET_NAME;
    }

    get isMultipage() {
        return this.config.specs.length > 1 || this.config.specs.some(spec => !!spec.multipage);
    }

    requiresPreview() {
        return !(/<!--\s*no preview\s*-->/.test(this.body));
    }

    async requestIncludes() {
        for (let spec of this.specs) {
            await spec.requestIncludes();
        }
    }

    touchesSrcFile() {
        return this.specs.some(spec => spec.touchesSrcFile(this.files));
    }

    async getPreviewFiles() {
        this.preview_files = [];
        this.unchanged_files = [];

        for (let spec of this.specs) {
            if (!spec.touchesSrcFile(this.files)) {
                continue;
            }

            await spec.getPreviewFiles();
            this.preview_files = [...this.preview_files, ...spec.preview_files];
            this.unchanged_files = [...this.unchanged_files, ...spec.unchanged_files];
        }
    }

    async cacheAll() {
        for (let file of this.preview_files) {
            await file.cache();
        }
        for (let file of this.unchanged_files) {
            await file.cache();
        }
        for (let spec of this.specs) {
            spec.cleanup();
        }
    }
}

module.exports = PR;
