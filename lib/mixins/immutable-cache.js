"use strict";

const cache = require("../cache");

module.exports = (superclass) => class extends superclass {
    // owner/repo/pull/45/7dfd134.html
    get key() {
        return `${ this.owner }/${ this.repo }/pull/${ this.pr.number }/${ this.short_sha }.html`;
    }

    get cache_url() {
        return cache.getUrl(this.key);
    }

    cache() {
        return cache.immutable(this.key, _ => this.fetch());
    }
};