"use strict";
const mix = require("../mix");
const ImmutableCache = require("../mixins/immutable-cache");

const urlencode = require("urlencode");
const fetchUrl = require("../fetch-url");

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
        // owner/repo/3834774..7dfd134.html
        // owner/repo/3834774..contributor:7dfd134.html
        // owner/repo/3834774..7dfd134/foo.html
        // owner/repo/3834774..contributor:7dfd134/foo.html
        let h = this.head;
        let b = this.base;
        let prefix = this.in_same_repo ? "" : h.owner + ":";
        let suffix = this.filename ? `/${ this.filename }.html` : ".html"
        return `${ b.owner }/${ b.repo }/${ b.short_sha }...${ prefix }${ h.short_sha }${ suffix }`;
    }
  
    getHtmlDiffUrl() {
        let base = urlencode(this.base.cache_url);
        let head = urlencode(this.head.cache_url);
        return `https://services.w3.org/htmldiff?doc1=${ base }&doc2=${ head }`;
    }
    
    fetch() {
        return fetchUrl(this.getHtmlDiffUrl());
    }
}

module.exports = SpecDiff;