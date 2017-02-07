"use strict";
var gh = require("simple-github")({ token: process.env.GITHUB_TOKEN });
var urlencode = require("urlencode");
var entities = require("entities");
var bikeshedUrl = require("./bikeshed-url");
var cache = require("./cache");

var COMMENT_INTRO = `<!--
    This comment and the below content is programatically generated.`;
var COMMENT_BODY = `    You may add a comma-separated list of anchors you'd like a
    direct link to below (e.g. #idl-serializers, #idl-sequence):`;
var COMMENT_OUTRO = `    Don't remove this comment or modify anything below this line.
    If you don't want a preview generated for this pull request,
    just replace the whole of this comment's content by "no preview"
    and remove what's below.
-->`;

module.exports = (payload) => {
    var options = ghOptions(payload);
    return getConfig(payload).then(config => {
        return gh.request("GET /repos/:owner/:repo/pulls/:number/commits", options).then(commits => {
            return gh.request("GET /repos/:owner/:repo/pulls/:number/files", options).then(files => {
                return updateBody(config, payload, commits, files).then(b => {
                    console.log(b)
                    return b
                });
            });
        });
    });
};

let getConfig = payload => {
    var config = {
        "ed_url": edURL(payload.base),
        "src_file": "index.bs",
        "target_file": "index.html",
        "bikeshed_parameters": {}
    }
    return gh.request("GET /repos/:owner/:repo/contents/.pr-preview.json").then(file => {
        if (file.type != "file") {
            throw new Error(".pr-preview.json is not a file.");
        }
        var json = JSON.parse(new Buffer(file.content, "base64").toString("utf8"));
        Object.keys(json).forEach(k => config[k] = json[k]);
    }).catch(_ => config).then(function(config) {
        return gh.request(`GET /repos/:owner/:repo/contents/${config.target_file}`).then(file => {
            config.auto_rendering = file.type != "file";
            return config;
        }, _ => {
            config.auto_rendering = true;
            return config;
        });
    });
};

let edURL = (base) => `https://${base.repo.owner.login}.github.io/${ base.repo.name }/`;

let ghOptions = payload => { return {
    number: payload.number,
    owner: payload.base.repo.owner.login,
    repo: payload.base.repo.name
}};

let shortSha = s => s.substr(0, 7);

let diff = (prev, next, anchor) => {
    prev = urlencode(prev.split("#")[0]);
    next = urlencode(next.split("#")[0]);
    return `https://services.w3.org/htmldiff?doc1=${ prev }&doc2=${ next }${ anchor || "" }`
};

// owner/repo/7dfd134.html
let cacheKey = commit => `${ commit.repo.owner.login }/${ commit.repo.name }/${ shortSha(commit.sha) }.html`;

// owner/repo/3834774..contributor/7dfd134.html
// owner/repo/ed..contributor/7dfd134.html
let diffCacheKey = (base, head, ed) => `${ base.repo.owner.login }/${ base.repo.name }/${ ed ? "ed" : shortSha(base.sha) }..${ head.repo.owner.login }/${ shortSha(head.sha) }.html`;

let latest = (config, pr, base, anchors) => {
    return Promise.all([
        cache(cacheKey(pr), bikeshedUrl(config, pr)),
        cache(cacheKey(base), bikeshedUrl(config, base))
    ]).then(function(urls) {
        let head_url = urls[0];
        let base_url = urls[1];
        let anchor = anchors.length == 1 ? anchors[0] : null;
        return Promise.all([
            cache(diffCacheKey(base, pr, true),  diff(config.ed_url, head_url, anchor)),
            cache(diffCacheKey(base, pr, false), diff(base_url, head_url, anchor))
        ]).then(function(diffs) {
            let ed_diff = diffs[0];
            let base_diff = diffs[1];
            let size = Math.floor(40 / anchors.length);
            return `[Preview](${ head_url }) ${ displayAnchors(head_url, anchors, size) }| [Diff w/ current ED](${ ed_diff }) | [Diff w/ base](${ base_diff })`;
        });
    });
};

// TODO needs to be async
// let rawgit = (repo, sha, anchor) => `https://cdn.rawgit.com/${ repo }/${ shortSha(sha) }/index.html${ anchor || "" }`;
// 
// let perCommit = (config, pr, base, current, prev, is_last, anchors) => {
//     let anchor = anchors.length == 1 ? anchors[0] : null;
//     let url = rawgit(pr.repo.full_name, current.sha, anchor);
//     let diffWED = diff(config.ed_url, url, anchor);
//     let prevTxt = "";
//     let txt = `<code title=${ JSON.stringify(msg(current)) }>${ shortSha(current.sha) }</code>`;
//     if (prev) {
//         let prevUrl = rawgit(pr.repo.full_name, prev.sha, anchor);
//         let prevDiff = diff(prevUrl, url, anchor);
//         prevTxt = ` | [Diff w/ Previous](${ prevDiff })`
//     }
//     if (is_last) txt = `Latest (${ txt })`;
//     return `${ txt }: [Preview](${ url }) ${ displayAnchors(url, anchors) }| [Diff w/ current ED](${ diffWED })${ prevTxt } _(${ current.commit.author.date.substr(0, 16).replace("T", " ") })_`;
// };
// let previous = (config, pr, base, commits, anchors) => {
//     if (commits.length == 1) return "";
//     return "<details><summary>Per Commit Preview &amp; Diffs</summary>\n\n" + commits.map((c, i) => {
//         return perCommit(config, pr, base, c, commits[i-1], commits.length - 1 == i, anchors);
//     }).join("\n") + "</details>";
// };

let msg = (c, size) => entities.encodeHTML(shorten(c.commit.message, size));

let shorten = (txt, size) => {
    txt = txt.split("\n")[0];
    if (size < txt.length) {
        return txt.substr(0, size).trim() + "…";
    }
    return txt;
};

let getAnchors = (body) => {
    body = body.replace(/\r\n/g, "\n").split(COMMENT_BODY);
    if (body.length < 2) return [];
    return body[1].split(COMMENT_OUTRO)[0].trim().split(/,\s*/).filter(a => !(/^\s*$/).test(a)).map(a => "#" + a.trim().replace("#", ""));
};

let comment = (config, data, commits) => {
    var anchors = getAnchors(data.body);
    // ${ previous(config, data.head, data.base, commits, anchors) } TODO make async
    return latest(config, data.head, data.base, anchors).then(txt => {
        return `\n\n\n${ COMMENT_INTRO }\n${ COMMENT_BODY }\n${ anchors.join(", ")}\n${ COMMENT_OUTRO }\n***\n${ txt }`
    });
};

let body = (config, data, commits, files) => {
    let body = data.body.replace(/\r\n/g, "\n").trim();
    let no_preview = /<!--\s*no preview\s*-->/.test(body);
    let no_rendered_file = files.every(f => f.filename != config.target_file);
    if (no_preview || (no_rendered_file && !config.auto_rendering)) {
        return Promise.resolve({
            updated: false,
            config: config,
            needsUpdate: false,
            previous: body
        });
    }
    return comment(config, data, commits).then(content => {
        let newBod = body.split(COMMENT_INTRO)[0].trim() + content;
        return {
            updated: false,
            config: config,
            needsUpdate: body != newBod.trim(),
            content: newBod,
            previous: body
        }
    });
};

let displayAnchors = (url, anchors, size) => {
    if (!anchors || anchors.length < 2) return "";
    if (typeof size == "number") {
      size = Math.floor(size);
      if (size < 3) {
        size = null;
      }
    }
    return anchors.map(a => `(<a href="${ url }${ a }" title="${ a }">${ size ? shorten(a, size) : "#" }</a>)`).join(" ") + " ";
};

let updateBody = (config, data, commits, files) => {
    return body(config, data, commits, files).then(b => {
        console.log("updateBody", b)
        if (b.needsUpdate) {
            if (process.env.NODE_ENV == "production") {
                let options = ghOptions(data);
                options.body = { body: b.content };
                return gh.request("PATCH /repos/:owner/:repo/pulls/:number", options).then(_ => {
                    b.updated = true;
                    return b;
                }, err => {
                    b.error = err;
                    return b;
                });
            } else {
                b.updated = "Not a live run!";
            }
        }
        return b;
    });
};
