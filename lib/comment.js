"use strict";
var gh = require("simple-github")({
  owner: "heycam",
  repo: "webidl",
  token: process.env.GITHUB_TOKEN
});
var urlencode = require("urlencode");
var entities = require("entities");

var ED_URL = "https://heycam.github.io/webidl/";
var COMMENT_INTRO = `<!--
    This comment and the below content is programatically generated.`;
var COMMENT_BODY = `    You may add a comma-separated list of anchors you'd like a
    direct link to below (e.g. #idl-serializers, #idl-sequence):`;
var COMMENT_OUTRO = `    Don't remove this comment or modify anything below this line.
-->`;

module.exports = (payload) => gh.request("GET /repos/:owner/:repo/pulls/:number/commits", { number: payload.number }).then(commits => {
    return updateBody(payload, commits);
});

let shortSha = s => s.substr(0, 7);
let diff = (prev, next, anchor) => {
    prev = urlencode(prev.split("#")[0]);
    next = urlencode(next.split("#")[0]);
    return `https://services.w3.org/htmldiff?doc1=${ prev }&doc2=${ next }${ anchor || "" }`
};
let diffWithED = (current, anchor) => diff(ED_URL, current, anchor);
let rawgit = (repo, sha, anchor) => `https://cdn.rawgit.com/${ repo }/${ shortSha(sha) }/index.html${ anchor || "" }`;

let latest = (repo, sha, base_repo, base_sha, anchors) => {
    let anchor = anchors.length == 1 ? anchors[0] : null;
    let url = rawgit(repo, sha, anchor);
    let base_url = rawgit(base_repo, base_sha, anchor);
    let ed_diff = diffWithED(url, anchor);
    let base_diff = diff(base_url, url, anchor);
    let size = Math.floor(40 / anchors.length);
    return `[Preview](${ url }) ${ displayAnchors(url, anchors, size) }| [Diff w/ current ED](${ ed_diff }) | [Diff w/ base](${ base_diff })`;
}
let perCommit = (repo, current, prev, last, anchors) => {
    let anchor = anchors.length == 1 ? anchors[0] : null;
    let url = rawgit(repo, current.sha, anchor);
    let diffWED = diffWithED(url, anchor);
    let prevTxt = "";
    let txt = `<code title=${ JSON.stringify(msg(current)) }>${ shortSha(current.sha) }</code>`;
    if (prev) {
        let prevUrl = rawgit(repo, prev.sha, anchor);
        let prevDiff = diff(prevUrl, url, anchor);
        prevTxt = ` | [Diff w/ Previous](${ prevDiff })`
    }
    if (last) txt = `Latest (${ txt })`;
    return `${ txt }: [Preview](${ url }) ${ displayAnchors(url, anchors) }| [Diff w/ current ED](${ diffWED })${ prevTxt } _(${ current.commit.author.date.substr(0, 16).replace("T", " ") })_`;
}
let msg = (c, size) => {
    return entities.encodeHTML(shorten(c.commit.message, size));
}

let shorten = (txt, size) => {
    txt = txt.split("\n")[0];
    if (size < txt.length) {
        return txt.substr(0, size).trim() + "…";
    }
    return txt;
}

let previous = (repo, commits, anchors) => {
    if (commits.length == 1) return "";
    return "<details><summary>Per Commit Preview &amp; Diffs</summary>" + commits.map((c, i) => {
        return perCommit(repo, c, commits[i-1], commits.length - 1 == i, anchors);
    }).join("\n") + "</details>";
}

let getAnchors = (body) => {
    body = body.replace(/\r\n/g, "\n").split(COMMENT_BODY);
    if (body.length < 2) return [];
    return body[1].split(COMMENT_OUTRO)[0].trim().split(/,\s*/).filter(a => !(/^\s*$/).test(a)).map(a => "#" + a.trim().replace("#", ""));
}

let comment = (data, commits) => {
    var pr_branch   = data.head.ref;
    var pr_sha      = data.head.sha;
    var pr_repo     = data.head.repo.full_name;

    var base_branch = data.base.ref;
    var base_sha    = data.base.sha;
    var base_repo   = data.base.repo.full_name;
    var anchors = getAnchors(data.body);
    return `\n\n
${ COMMENT_INTRO }
${ COMMENT_BODY }
    ${ anchors.join(", ")}
${ COMMENT_OUTRO }
***
${ latest(pr_repo, pr_sha, base_repo, base_sha, anchors) }`
// ${ previous(pr_repo, commits, anchors) }
}

let body = (data, commits) => {
    let body = data.body.replace(/\r\n/g, "\n").trim();
    let newBod = body.split(COMMENT_INTRO)[0].trim() + comment(data, commits);
    return {
        needsUpdate: body != newBod.trim(),
        content: newBod,
        previous: body
    }
}

let displayAnchors = (url, anchors, size) => {
    if (!anchors || anchors.length < 2) return "";
    if (typeof size == "number") {
      size = Math.floor(size);
      if (size < 3) {
        size = null;
      }
    }
    return anchors.map(a => `(<a href="${ url }${ a }" title="${ a }">${ size ? shorten(a, size) : "#" }</a>)`).join(" ") + " ";
}

let updateBody = (data, commits) => {
    let b = body(data, commits);
    b.updated = false;
    if (b.needsUpdate) {
        if (process.env.NODE_ENV == "production") {
            return gh.request("PATCH /repos/:owner/:repo/pulls/:number", {
                number: data.number,
                body: {
                    body: b.content
                }
            }).then(_ => {
                b.updated = true;
                return b;
            }, err => {
                b.error = err
                return b;
            });
        } else {
            b.updated = "Not a live run!";
        }
    }
    return Promise.resolve(b);
}
