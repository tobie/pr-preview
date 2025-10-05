"use strict";
const EMPTYPAGE = "https://s3.amazonaws.com/pr-preview/emptypage.html";
const mix = require("../mix");
const ImmutableCache = require("../mixins/immutable-cache");
const Uploadable = require("../mixins/uploadable");
const HTMLDIFF_SERVICE = require("../services").HTMLDIFF;

const urlencode = require("urlencode");
const fetchUrl = require("../fetch-url");
const postProcessor = require("../post-processor");
const fs = require("fs").promises;

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
        let number = b.pr.number;
        let suffix = this.filename ? `/${ this.filename }` : ".html"
        if (this.aws_s3_bucket == "whatpr.org") {
            // /repo/45/3834774...7dfd134.html
            // /repo/45/3834774...7dfd134/foo.html
            return `${ b.repo }/${ number }/${ b.short_sha }...${ h.short_sha }${ suffix }`;
        } else {
            // owner/repo/45/3834774...7dfd134.html
            // owner/repo/45/3834774...contributor:7dfd134.html
            // owner/repo/45/3834774...7dfd134/foo.html
            // owner/repo/45/3834774...contributor:7dfd134/foo.html
            let prefix = this.in_same_repo ? "" : h.owner + ":";
            return `${ b.owner }/${ b.repo }/${ number }/${ b.short_sha }...${ prefix }${ h.short_sha }${ suffix }`;
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
        return fetchUrl(url, HTMLDIFF_SERVICE);
    }
}

class AddedFileSpecDiff extends SpecDiff {
    getHtmlDiffUrl() {
        let head = urlencode(this.head.cache_url);
        return `https://services.w3.org/htmldiff?doc1=${ EMPTYPAGE }&doc2=${ head }`;
    }
}

class RemovedFileSpecDiff extends SpecDiff {
    getHtmlDiffUrl() {
        let base = urlencode(this.base.cache_url);
        return `https://services.w3.org/htmldiff?doc1=${ base }&doc2=${ EMPTYPAGE }`;
    }
}

class NoSpecDiff extends SpecDiff {
    constructor(head, base, filepath, filename) {
        super(head, base, filename);
        this.filepath = filepath;
    }
    
    async fetch() {
        // Read file from disk with post-processing and script injection
        console.log(`Read file: ${ this.filepath }`);
        const postProcess = postProcessor(this.pr.postProcessingConfig) || postProcessor.noop;

        try {
            const body = await fs.readFile(this.filepath, "utf8");
            const processedHtml = await postProcess(body);
            return processedHtml + '<script src="https://w3c.github.io/htmldiff-nav/index.js"></script>';
        } catch (err) {
            err.data = { filepath: this.filepath };
            throw err;
        }
    }
}

module.exports = SpecDiff;
module.exports.AddedFileSpecDiff = AddedFileSpecDiff;
module.exports.RemovedFileSpecDiff = RemovedFileSpecDiff;
module.exports.NoSpecDiff = NoSpecDiff;
