"use strict";

const cache = require("../cache");

module.exports = (superclass) => class extends superclass {  
    get key() {
        let k = `${ this.repo }/pull/${ this.pr.number }`;
        if (this.aws_s3_bucket == "whatpr.org") {
            // repo/pull/45.html
            // repo/pull/45/foo.html
            k = k;
        } else {
            // owner/repo/pull/45.html
            // owner/repo/pull/45/foo.html
            k = `${ this.owner }/${ k }`;
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