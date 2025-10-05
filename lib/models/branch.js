"use strict";
const mix = require("../mix");
const MutableCache = require("../mixins/mutable-cache");
const ImmutableCache = require("../mixins/immutable-cache");
const ProcessorFactory = require("../processors/processor-factory");
const Uploadable = require("../mixins/uploadable");
const PROPS = ["pr", "owner", "repo", "branch", "sha"];

class Branch {
    constructor(options) {
        options = options || {};
        PROPS.forEach(k => {
            if (!(k in options)) {
                throw new TypeError(`Missing ${ k }`);
            }
            this[`_${ k }`] = options[k];
        });
        this._filename = options.filename;
    }

    get pr() {
        return this._pr;
    }

    get payload() {
        return this._payload;
    }

    get owner() {
        return this._owner;
    }

    get repo() {
        return this._repo;
    }

    get branch() {
        return this._branch;
    }

    get ref() {
        return this.branch;
    }

    get sha() {
        return this._sha;
    }
    
    get filename() {
        return this._filename;
    }

    get short_sha() {
        return this.sha.substr(0, 7);
    }

    get aws_s3_bucket() {
        return this.pr.aws_s3_bucket;
    }

    get file_path() {
        return `${ this.owner }/${ this.repo }/${ this.sha }/${ this.pr.config.src_file }`;
    }

    get github_url() {
        return `https://raw.githubusercontent.com/${ this.file_path }`;
    }

    get github_repo_url() {
        return `https://raw.githubusercontent.com/${ this.owner }/${ this.repo }/${ this.sha }/`;
    }

    urlOptions() {
        return {
            config:       this.pr.config,
            pull_request: this.pr.payload,
            owner:        this.owner,
            repo:         this.repo,
            branch:       this.ref,
            sha:          this.sha,
            short_sha:    this.short_sha,
            url:          this.cache_url
        };
    }

    getUrl(options) {
        const processor = ProcessorFactory.create(this.pr.processor);
        return processor.getUrl(this.github_url, options);
    }


    fetch() {
        const processor = ProcessorFactory.create(this.pr.processor);
        return processor.processFiles(this);
    }
}

class Head extends mix(Branch).with(MutableCache) {
    static fromPR(pr, filename) {
        return new this({
            pr:       pr,
            owner:    pr.payload.head.repo.owner.login,
            repo:     pr.payload.head.repo.name,
            branch:   pr.payload.head.ref,
            sha:      pr.payload.head.sha,
            filename: filename
        });
    }
}
class Base extends mix(Branch).with(ImmutableCache) {
    static fromPR(pr, filename) {
        return new this({
            pr:       pr,
            owner:    pr.payload.base.repo.owner.login,
            repo:     pr.payload.base.repo.name,
            branch:   pr.payload.base.ref,
            sha:      pr.payload.base.sha,
            filename: filename
        });
    }
}
class MergeBase extends mix(Branch).with(ImmutableCache) {
    static fromPR(pr, filename) {
        return new this({
            pr:       pr,
            owner:    pr.owner,
            repo:     pr.repo,
            branch:   pr.payload.base.ref,
            sha:      pr.merge_base_sha,
            filename: filename
        });
    }
}

class Wattsi extends Branch {
    constructor(options) {
        super(options);
        this._filepath = options.filepath;
    }
    
    get filepath() {
        return this._filepath;
    }
}

class WattsiHead extends mix(Wattsi).with(MutableCache, Uploadable) {
    static fromPR(pr, filepath, filename) {
        return new this({
            pr:       pr,
            owner:    pr.payload.head.repo.owner.login,
            repo:     pr.payload.head.repo.name,
            branch:   pr.payload.head.ref,
            sha:      pr.payload.head.sha,
            filepath: filepath,
            filename: filename
        });
    }
}

class WattsiMergeBase extends mix(Wattsi).with(ImmutableCache, Uploadable) {
    static fromPR(pr, filepath, filename) {
        return new this({
            pr:       pr,
            owner:    pr.owner,
            repo:     pr.repo,
            branch:   pr.payload.base.ref,
            sha:      pr.merge_base_sha,
            filepath: filepath,
            filename: filename
        });
    }
}

module.exports = Branch;
module.exports.Head = Head;
module.exports.Base = Base;
module.exports.MergeBase = MergeBase;
module.exports.WattsiHead = WattsiHead;
module.exports.WattsiMergeBase = WattsiMergeBase;

