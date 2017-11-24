"use strict";

var dateFormat = require('dateformat');

const COMMENT_INTRO = `<!--
    This comment and the below content is programatically generated.`;
const COMMENT_BODY = `    You may add a comma-separated list of anchors you'd like a
    direct link to below (e.g. #idl-serializers, #idl-sequence):`;
const COMMENT_OUTRO = `    Don't remove this comment or modify anything below this line.
    If you don't want a preview generated for this pull request,
    just replace the whole of this comment's content by "no preview"
    and remove what's below.
-->`;

let shorten = (txt, size) => {
    txt = txt.split("\n")[0];
    if (size < txt.length) {
        return txt.substr(0, size).trim() + "…";
    }
    return txt;
};

class ViewComment {
    constructor() {
    }
    
    render(pr) {
        let body = pr.body.split(COMMENT_INTRO)[0].trim();
        return `${body}


${ COMMENT_INTRO }
${ COMMENT_BODY }
${ this.getAnchors(pr).join(", ") }
${ COMMENT_OUTRO }
***
${ this.content(pr) }`;
    }
    
    getDate(date) {
        date = dateFormat(date, "UTC:mmm d, yyyy, h:MM TT");
        return `Last updated on ${ date } GMT`;
    }
    
    getAnchors(pr) {
        let a = pr.body.split(COMMENT_BODY);
        if (a.length < 2) return [];
        return a[1].split(COMMENT_OUTRO)[0].trim().split(/,\s*/)
            .filter(a => !(/^\s*$/).test(a))
            .map(a => "#" + a.trim().replace("#", ""));
    }
    
    content(pr) {
        if (pr.preview_files.length == 1) {
            let f = pr.preview_files[0];
            let anchors = this.getAnchors(pr);
            let anchor = anchors.length == 1 ? anchors[0] : "";
            let size = Math.floor(40 / anchors.length);
        
            let title = this.getDate(new Date());
            let preview = this.displayLink("Preview", this.preview_url(f, pr.config) + anchor, title);
            let diff = this.displayLink("Diff", f.diff.cache_url, title);
            return `${ preview } ${ this.displayAnchors(this.preview_url(f, pr.config), anchors, size) }| ${ diff }`;
        }
        
        throw new Error("Support for multiple preview files not yet implemented.")
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
    
    preview_url(f, config) {
        if (f.diff.in_same_repo && f.base.owner == "whatwg" && config.ls_url) {
            return `${ config.ls_url.replace(/\/$/, "") }/branch-snapshots/${ f.head.branch }/`;
        }
        return f.head.cache_url;
    }
}

module.exports = ViewComment;