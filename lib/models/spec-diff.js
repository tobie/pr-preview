"use strict";
const mix = require("../mix");
const ImmutableCache = require("../mixins/immutable-cache");
const Uploadable = require("../mixins/uploadable");

const urlencode = require("urlencode");
const fetchUrl = require("../fetch-url");
const fs = require("fs");

class SpecDiff extends mix().with(ImmutableCache) {
    constructor(head, base, filename) {
        super();
        this.head = head;
        this.base = base;
        this.filename = filename;
    }
    
    get in_same_repo() {
        return this.head.owner == this.base.owner;
    }
    get key() {
        let h = this.head;
        let b = this.base;
        let suffix = this.filename ? `/${ this.filename }` : ".html"
        if (this.aws_s3_bucket == "whatpr.org") {
            // /repo/3834774...7dfd134.html
            // /repo/3834774...7dfd134/foo.html
            return `${ b.repo }/${ b.short_sha }...${ h.short_sha }${ suffix }`;
        } else {
            // owner/repo/3834774...7dfd134.html
            // owner/repo/3834774...contributor:7dfd134.html
            // owner/repo/3834774...7dfd134/foo.html
            // owner/repo/3834774...contributor:7dfd134/foo.html
            let prefix = this.in_same_repo ? "" : h.owner + ":";
            return `${ b.owner }/${ b.repo }/${ b.short_sha }...${ prefix }${ h.short_sha }${ suffix }`;
        }
    }
  
    getHtmlDiffUrl() {
        let base = urlencode(this.base.cache_url);
        let head = urlencode(this.head.cache_url);
        return `https://services.w3.org/htmldiff?doc1=${ base }&doc2=${ head }`;
    }
    
    get aws_s3_bucket() {
        return this.head.aws_s3_bucket;
    }
    
    fetch() {
        let url = this.getHtmlDiffUrl()
        console.log(`Fetch: ${ url }`);
        return fetchUrl(url);
    }
}

class NoSpecDiff extends mix(SpecDiff).with(Uploadable) {
    constructor(head, base, filepath, filename) {
        super(head, base, filename);
        this.filepath = filepath;
    }
    
    fetch() {
        console.log(`Read file: ${ this.filepath }`);
        return new Promise((resolve, reject) => {
            fs.readFile(this.filepath, "utf8", (err, body) => {
                if (err) {
                    err.data = { filepath: this.filepath };
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        }).then(html => html + '<script src="https://w3c.github.io/htmldiff-nav/index.js"></script>');
    }
}

module.exports = SpecDiff;
module.exports.NoSpecDiff = NoSpecDiff;