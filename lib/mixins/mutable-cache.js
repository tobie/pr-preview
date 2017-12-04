"use strict";

const cache = require("../cache");

module.exports = (superclass) => class extends superclass {  
    get key() {
        let k;
        if (this.aws_s3_bucket == "whatpr.org") {
            // repo/45.html
            // repo/45/foo.html
            k = `${ this.repo }/${ this.pr.number }`;
        } else {
            // owner/repo/pull/45.html
            // owner/repo/pull/45/foo.html
            k = `${ this.owner }/${ this.repo }/pull/${ this.pr.number }`;
        }
        return this.filename ? `${ k }/${ this.filename }` : `${ k }.html`;
    }

    get cache_url() {
        return cache.getUrl(this.aws_s3_bucket, this.key);
    }

    cache() {
        return cache.mutable(this.aws_s3_bucket, this.key, _ => this.fetch());
    }
};