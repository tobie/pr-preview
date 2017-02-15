"use strict";
const cache = require("../cache");
const urlencode = require("urlencode");

class SpecDiff {
    constructor(head, base) {
        this.head = head;
        this.base = base;
    }
    
    cache() {
        return cache.immutable(this.key, this.getHtmlDiffUrl());
    }
    
    get in_same_repo() {
        return this.head.owner == this.base.owner;
    }
    get key() {
        // owner/repo/3834774..branch:7dfd134.html
        // owner/repo/3834774..contributor:branch:7dfd134.html
        let h = this.head;
        let b = this.base;
        let prefix = this.in_same_repo ? h.branch : h.label;
        return `${ b.owner }/${ b.repo }/${ b.short_sha }..${ prefix }:${ h.short_sha }.html`;
    }
    
    get cache_url() {
        return cache.getUrl(this.key);
    }
    
    getHtmlDiffUrl() {
        let base = urlencode(this.base.cache_url);
        let head = urlencode(this.head.cache_url);
        return `https://services.w3.org/htmldiff?doc1=${ base }&doc2=${ head }`;
    }
}

module.exports = SpecDiff;