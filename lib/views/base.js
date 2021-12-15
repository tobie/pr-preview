"use strict";

var dateFormat = require('dateformat');

const COMMENT_INTRO = `<!--
    This comment and the below content is programmatically generated.`;
const COMMENT_BODY = `    You may add a comma-separated list of anchors you'd like a
    direct link to below (e.g. #idl-serializers, #idl-sequence):`;
const COMMENT_OUTRO = `    Don't remove this comment or modify anything below this line.
    If you don't want a preview generated for this pull request,
    just replace the whole of this comment's content by "no preview"
    and remove what's below.
-->`;

class ViewBase {
    constructor() {
    }

    getAnchors(pr) {
        let a = pr.body.split(COMMENT_BODY);
        if (a.length < 2) return [];
        return a[1].split(COMMENT_OUTRO)[0].trim().split(/,\s*/)
            .filter(a => !(/^\s*$/).test(a))
            .map(a => "#" + a.trim().replace("#", ""));
    }

    render(pr, ...rest) {
        let body = pr.body.split(COMMENT_INTRO)[0].trim();
        return `${body}


${ COMMENT_INTRO }
${ COMMENT_BODY }
${ this.getAnchors(pr).join(", ") }
${ COMMENT_OUTRO }
***
${ this.content(pr, ...rest) }`;
    }
    
    getDate(date) {
        return dateFormat(date, "UTC:mmm d, yyyy, h:MM TT") + " UTC";
    }
    
    content(pr) {
        throw new Error("Must implement content method.");
    }
}

module.exports = ViewBase;