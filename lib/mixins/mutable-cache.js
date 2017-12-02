"use strict";

const cache = require("../cache");

module.exports = (superclass) => class extends superclass {  
    // owner/repo/pull/45.html
    // owner/repo/pull/45/foo.html
    get key() {
        let k = `${ this.owner }/${ this.repo }/pull/${ this.pr.number }`;
        if (this.filename) {
            return `${ k }/${ this.filename }`;
        }
        return `${ k }.html`;
    }

    get cache_url() {
        return cache.getUrl(this.aws_s3_bucket, this.key);
    }

    cache() {
        return cache.mutable(this.aws_s3_bucket, this.key, _ => this.fetch());
    }
};