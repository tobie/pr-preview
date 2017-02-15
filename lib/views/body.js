"use strict";

const COMMENT_INTRO = `<!-- test
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
        return `${body}\n\n\n${ COMMENT_INTRO }\n${ COMMENT_BODY }\n${ this.getAnchors(pr).join(", ")}\n${ COMMENT_OUTRO }\n***\n${ this.content(pr) }`
    }
    
    getAnchors(pr) {
        let a = pr.body.split(COMMENT_BODY);
        if (a.length < 2) return [];
        return a[1].split(COMMENT_OUTRO)[0].trim().split(/,\s*/)
            .filter(a => !(/^\s*$/).test(a))
            .map(a => "#" + a.trim().replace("#", ""));
    }
    
    content(pr) {
        let anchors = this.getAnchors(pr);
        let anchor = anchors.length == 1 ? anchors[0] : "";
        let size = Math.floor(40 / anchors.length);
        return `[Preview](${ this.preview_url(pr) }${anchor}) ${ this.displayAnchors(this.preview_url(pr), anchors, size) }| [Diff](${ pr.diff.cache_url })`;
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
    
    preview_url(pr) {
        if (pr.diff.in_same_repo && pr.owner == "whatwg" && pr.config.ls_url) {
            return `${ pr.config.ls_url.replace(/\/$/, "") }/branch-snapshots/${ pr.head.ref }/`;
        }
        return pr.head.cache_url;
    }
}

module.exports = ViewComment;