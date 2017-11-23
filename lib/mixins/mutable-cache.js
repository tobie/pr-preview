"use strict";

const cache = require("../cache");

module.exports = (superclass) => class extends superclass {  
    // owner/repo/branch.html
    get key() {
        return `${ this.owner }/${ this.repo }/pull/${ this.pr.number }.html`;
    }

    get cache_url() {
        return cache.getUrl(this.key);
    }

    cache() {
        return cache.mutable(this.key, _ => this.fetch());
    }
};