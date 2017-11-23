"use strict";
const mix = require("../mix");
const MutableCache = require("../mixins/mutable-cache");
const ImmutableCache = require("../mixins/immutable-cache");
const Fetchable = require("../mixins/fetchable");
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

    get short_sha() {
        return this.sha.substr(0, 7);
    }
}

class Head extends mix(Branch).with(MutableCache, Fetchable) {
    static fromPR(pr) {
        return new this({
            pr:     pr,
            owner:  pr.payload.head.repo.owner.login,
            repo:   pr.payload.head.repo.name,
            branch: pr.payload.head.ref,
            sha:    pr.payload.head.sha
        });
    }
}
class Base extends mix(Branch).with(ImmutableCache, Fetchable) {
    static fromPR(pr) {
        return new this({
            pr:     pr,
            owner:  pr.payload.base.repo.owner.login,
            repo:   pr.payload.base.repo.name,
            branch: pr.payload.base.ref,
            sha:    pr.payload.base.sha
        });
    }
}
class MergeBase extends mix(Branch).with(ImmutableCache, Fetchable) {}

module.exports = Branch;
module.exports.Head = Head;
module.exports.Base = Base;
module.exports.MergeBase = MergeBase;
