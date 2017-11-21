"use strict";
const mix = require("../mix");
const MutableCache = require("../mixins/mutable-cache");
const ImmutableCache = require("../mixins/immutable-cache");
const Fetchable = require("../mixins/fetchable");


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
}

class MergeBase extends mix(Branch).with(ImmutableCache, Fetchable) {
    constructor(sha, payload, pr) {
        super(payload, pr);
        this._sha = sha;
    }

    get sha() {
        return this._sha;
    }
}

class Head extends mix(Branch).with(MutableCache, Fetchable) {}
class Base extends mix(Branch).with(ImmutableCache, Fetchable) {}

module.exports = Branch;
module.exports.Head = Head;
module.exports.Base = Base;
module.exports.MergeBase = MergeBase;
