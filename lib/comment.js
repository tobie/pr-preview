"use strict";
var github = require("simple-github");
var auth = require("./auth");
var GH_API = require("./GH_API");
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

let currently_running = new Set();

module.exports = (payload) => {
    var pull_request = payload.pull_request;
    console.log("Currently running:", [...currently_running]);
    let k = `${pull_request.base.repo.full_name}/${pull_request.number}`;
    if (currently_running.has(k)) {
        return Promise.resolve({
            id: k,
            updated: false,
            error: new Error(`Race condition for ${k}`)
        });
    }
    currently_running.add(k);
    let release = b => {
        currently_running.delete(k);
        b.id = k;
        return b;
    };
    var requestOpts = requestOptions(pull_request);
    return auth(payload).then(headers => {
        let gh = github({ headers: headers });
        return getConfig(gh, pull_request).then(config => {
            return gh.request(GH_API.GET_PR_COMMITS, requestOpts).then(commits => {
                return gh.request(GH_API.GET_PR_FILES, requestOpts).then(files => {
                    return updateBody(gh, config, pull_request, commits, files).then(release, release);
                });
            });
        });
    });
};

let getConfig = (gh, pull_request) => {
    var config = {
        "ed_url": edURL(pull_request.base),
        "src_file": "index.bs",
        "target_file": "index.html",
        "bikeshed_parameters": {}
    };

    return gh.request(GH_API.GET_CONFIG_FILE, requestOptions(pull_request)).then(file => {
        if (file.type != "file") {
            throw new Error(".pr-preview.json is not a file.");
        }
        var json = JSON.parse(new Buffer(file.content, "base64").toString("utf8"));
        console.log("Found repo config file", json);
        Object.keys(json).forEach(k => config[k] = json[k]);
        return config;
    }).catch(_ => config);
};

let edURL = (base) => `https://${base.repo.owner.login}.github.io/${ base.repo.name }/`;

let requestOptions = pull_request => { return {
    number: pull_request.number,
    owner: pull_request.base.repo.owner.login,
    repo: pull_request.base.repo.name
}};

let shortSha = s => s.substr(0, 7);

let diff = (prev, next, anchor) => {
    prev = urlencode(prev.split("#")[0]);
    next = urlencode(next.split("#")[0]);
    return `https://services.w3.org/htmldiff?doc1=${ prev }&doc2=${ next }${ anchor || "" }`
};

// owner/repo/7dfd134.html
let cacheKey = tip => `${ tip.repo.owner.login }/${ tip.repo.name }/${ shortSha(tip.sha) }.html`;

// owner/repo/3834774..contributor:7dfd134.html
// owner/repo/ed..contributor:7dfd134.html
let diffCacheKey = (base, head, ed) => {
    let outro = `${ head.repo.owner.login }:${ shortSha(head.sha) }`;
    if (head.repo.owner.login == base.repo.owner.login) {
        outro = shortSha(head.sha);
    }
    return `${ base.repo.owner.login }/${ base.repo.name }/${ ed ? "ed" : shortSha(base.sha) }..${ outro }.html`;
}

let bikeshedUrlOptions = (config, pull_request, tip) => {
    return {
        config:       config,
        pull_request: pull_request,
        owner:        tip.repo.owner.login,
        repo:         tip.repo.name,
        branch:       tip.ref,
        sha:          tip.sha,
        short_sha:    shortSha(tip.sha),
        url:          cache.getUrl(cacheKey(tip))
    };
};

let preview = (config, pull_request, head) => {
    if (head.repo.owner.login == "whatwg" && pull_request.base.repo.owner.login == "whatwg") {
        return Promise.resolve(`${config.ed_url}/branch-snapshots/${head.ref}/`);
    }
    return cache(cacheKey(head), bikeshedUrl(bikeshedUrlOptions(config, pull_request, head)));
};

let latest = (config, pull_request, anchors) => {
    let head = pull_request.head;
    let base = pull_request.base;
    return Promise.all([
        preview(config, pull_request, head),
        cache(cacheKey(base), bikeshedUrl(bikeshedUrlOptions(config, pull_request, base)))
    ]).then(function(urls) {
        let head_url = urls[0];
        let base_url = urls[1];
        let anchor = anchors.length == 1 ? anchors[0] : null;
        return Promise.all([
            diff(config.ed_url, head_url, anchor), // Can't cache until we have hooks to blow the cache out
            cache(diffCacheKey(base, head, false), diff(base_url, head_url, anchor))
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
// let perCommit = (config, head, base, current, prev, is_last, anchors) => {
//     let anchor = anchors.length == 1 ? anchors[0] : null;
//     let url = rawgit(head.repo.full_name, current.sha, anchor);
//     let diffWED = diff(config.ed_url, url, anchor);
//     let prevTxt = "";
//     let txt = `<code title=${ JSON.stringify(msg(current)) }>${ shortSha(current.sha) }</code>`;
//     if (prev) {
//         let prevUrl = rawgit(head.repo.full_name, prev.sha, anchor);
//         let prevDiff = diff(prevUrl, url, anchor);
//         prevTxt = ` | [Diff w/ Previous](${ prevDiff })`
//     }
//     if (is_last) txt = `Latest (${ txt })`;
//     return `${ txt }: [Preview](${ url }) ${ displayAnchors(url, anchors) }| [Diff w/ current ED](${ diffWED })${ prevTxt } _(${ current.commit.author.date.substr(0, 16).replace("T", " ") })_`;
// };
// let previous = (config, head, base, commits, anchors) => {
//     if (commits.length == 1) return "";
//     return "<details><summary>Per Commit Preview &amp; Diffs</summary>\n\n" + commits.map((c, i) => {
//         return perCommit(config, head, base, c, commits[i-1], commits.length - 1 == i, anchors);
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
    return latest(config, data, anchors).then(txt => {
        return `\n\n\n${ COMMENT_INTRO }\n${ COMMENT_BODY }\n${ anchors.join(", ")}\n${ COMMENT_OUTRO }\n***\n${ txt }`
    });
};

let body = (config, data, commits, files) => {
    let body = data.body.replace(/\r\n/g, "\n").trim();
    let no_preview = /<!--\s*no preview\s*-->/.test(body);
    let touched_src_file = files.some(f => f.filename == config.src_file);
    if (no_preview || !touched_src_file) {
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
    }, err => {
        return {
            updated: false,
            config: config,
            previous: body,
            error: err
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

let updateBody = (gh, config, data, commits, files) => {
    return body(config, data, commits, files).then(b => {
        if (b.needsUpdate) {
            if (process.env.NODE_ENV == "production") {
                let options = requestOptions(data);
                options.body = { body: b.content };
                return gh.request(GH_API.PATCH_PR, options).then(_ => {
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
