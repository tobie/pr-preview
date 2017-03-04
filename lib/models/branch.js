"use strict";
const cache = require("../cache");
const urlencode = require("urlencode");
const mustache = require("mustache");
mustache.escape = v => v;

class Branch {
    constructor(payload, pr) {
        if (!payload || !payload.repo) {
            throw new TypeError(`Not a branch: ${ JSON.stringify(payload, null, 4) }`);
        }

        if (!pr || pr.constructor.name != "PR") {
            throw new TypeError(`Not a PR instance: ${ JSON.stringify(pr, null, 4) }`);
        }
        this._payload = payload;
        this.pr = pr;
    }

    get owner() {
        return this._payload.repo.owner.login;
    }

    get repo() {
        return this._payload.repo.name;
    }

    get branch() {
        return this._payload.ref;
    }

    get ref() {
        return this.branch;
    }

    get label() {
        return this._payload.label;
    }

    get sha() {
        return this._payload.sha;
    }

    get short_sha() {
        return this.sha.substr(0, 7);
    }

    // owner/repo/branch.html
    get mutable_cache_key() {
        return `${ this.owner }/${ this.repo }/${ this.branch }.html`;
    }

    // owner/repo/branch/7dfd134.html
    get immutable_cache_key() {
        return `${ this.owner }/${ this.repo }/${ this.branch }/${ this.short_sha }.html`;
    }

    get file_path() {
        return `${ this.owner }/${ this.repo }/${ this.sha }/${ this.pr.config.src_file }`;
    }

    get github_url() {
        return `https://raw.githubusercontent.com/${ this.file_path }`;
    }

    get rawgit_url() {
        return `https://cdn.rawgit.com/${ this.file_path }`;
    }

    get cache_url() {
        return cache.getUrl(this.key);
    }

    get key() {
        throw Error("Needs to be implemented by subclass.")
    }

    cache() {
        throw Error("Needs to be implemented by subclass.")
    }

    getUrl() {
        if (this.pr.processor == "bikeshed") {
            return this.getBikeshedUrl();
        }

        if (this.pr.processor == "respec") {
            return this.getRespecUrl();
        }

        throw new Error(`Unknown processor ${pr.processor}`);
    }

    getBikeshedUrl() {
        let data = this.urlOptions();
        let params = this.pr.config.params || {};
        let query = Object.keys(params).map(k => {
            let tmpl = String(params[k]);
            let v = mustache.render(tmpl, data);
            return `${ k }=${ urlencode(v) }`
        }).join("&");
        query = query ? "&" + query : "";
        return `https://api.csswg.org/bikeshed/?url=${ urlencode(this.github_url) }${ query }`;
    }

    getRespecUrl() {
        let data = this.urlOptions();
        let params = this.pr.config.params || {};
        let query = Object.keys(params).map(k => {
            let tmpl = String(params[k]);
            let v = mustache.render(tmpl, data);
            return `${ k }=${ v }`
        }).join("&");
        query = query ? "?" + query : "";
        return `https://labs.w3.org/spec-generator/?type=respec&url=${urlencode(this.rawgit_url + query)}`
    }

    urlOptions() {
        return {
            config:       this.pr.config,
            pull_request: this.pr.raw.pull_request,
            owner:        this.owner,
            repo:         this.repo,
            branch:       this.ref,
            sha:          this.sha,
            short_sha:    this.short_sha,
            url:          this.cache_url
        };
    }
}

class MutableCacheBranch extends Branch {
    get key() {
        return this.mutable_cache_key;
    }

    cache() {
        return cache.mutable(this.key, this.getUrl());
    }
}

class ImmutableCacheBranch extends Branch {
    get key() {
        return this.immutable_cache_key;
    }

    cache() {
        return cache.immutable(this.key, this.getUrl());
    }
}

class MergeBase extends ImmutableCacheBranch {
    constructor(sha, payload, pr) {
        super(payload, pr);
        this._sha = sha;
    }

    get sha() {
        return this._sha;
    }
}

class Head extends MutableCacheBranch {}
class Base extends ImmutableCacheBranch {}

module.exports = Branch;
module.exports.Head = Head;
module.exports.Base = Base;
module.exports.MergeBase = MergeBase;
