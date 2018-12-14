"use strict";

var ViewBase = require('./base');

let shorten = (txt, size) => {
    txt = txt.split("\n")[0];
    if (size < txt.length) {
        return txt.substr(0, size).trim() + "…";
    }
    return txt;
};

class ViewComment extends ViewBase {
    constructor() {
        super();
    }
    
    lastUpdated(date, sha) {
        return `Last updated on ${ this.getDate(date) } (${ sha })`;
    }
    
    content(pr) {
        let anchors = this.getAnchors(pr);
        let anchor = anchors.length == 1 ? anchors[0] : "";
        let size = Math.floor(40 / anchors.length);

        if (pr.isMultipage) {
            return pr.preview_files.map(f => {
                let title = this.lastUpdated(new Date(), f.head.short_sha);
                let preview = this.displayLink(`/${f.head.filename}`, f.head.cache_url + anchor, title);
                let diff = this.displayLink("diff", f.diff.cache_url, title);
                return `${ preview } ${ this.displayAnchors(f.head.cache_url, anchors, size) } ( ${ diff } )`;
            }).join("\n");
        }

        let f = pr.preview_files[0];
        let title = this.lastUpdated(new Date(), f.head.short_sha);
        let preview = this.displayLink("Preview", f.head.cache_url + anchor, title);
        let diff = this.displayLink("Diff", f.diff.cache_url, title);
        return `${ preview } ${ this.displayAnchors(f.head.cache_url, anchors, size) }| ${ diff }`;
    }
    
    displayLink(content, href, title) {
        return `<a href="${ href }" title="${title}">${ content }</a>`;
    }

    displayAnchors(url, anchors, size) {
        if (!anchors || anchors.length < 2) return "";
        if (typeof size == "number") {
          size = Math.floor(size);
          if (size < 3) {
            size = null;
          }
        }
        return anchors.map(a => `(<a href="${ url }${ a }" title="${ a }">${ size ? shorten(a, size) : "#" }</a>)`).join(" ") + " ";
    }
}

module.exports = ViewComment;