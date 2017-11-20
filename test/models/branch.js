"use strict";
const assert = require("assert"),
    Branch = require("../../lib/models/branch"),
    PR = require("../../lib/models/pr");
const payload = require("../fixtures/pr");

suite("Branch model", function() {
 
    test("Test constructor throws when no args are present", function() {
        assert.throws(_ => new Branch(), TypeError);
    });
    
    test("Test constructor throws when a single arg is present", function() {
        assert.throws(_ => new Branch({}), TypeError);
        assert.throws(_ => new Branch(payload.pull_request.head), TypeError);
    });
    
    test("Test constructor throws when a incorrect args are present", function() {
        assert.throws(_ => new Branch({}, {}), TypeError);
        assert.throws(_ => new Branch(payload.pull_request.head, {}), TypeError);
        assert.throws(_ => new Branch({}, new PR("heycam/webidl/283", { id: 234 })), TypeError);
    });
    
    test("Test constructor doesn't throw when the right arguments are present", function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = payload.pull_request;
        let b = new Branch(payload.pull_request.head, pr);
        assert(b instanceof Branch);
        assert.equal(pr, b.pr);
    });
    
    test("Test getters", function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = payload.pull_request;
        let h = new Branch.Head(payload.pull_request.head, pr);
        assert.equal(h.owner, "tobie");
        assert.equal(h.repo, "webidl");
        assert.equal(h.branch, "interface-objs");
        assert.equal(h.ref, "interface-objs");
        assert.equal(h.sha, "7dfd134ee2e6df7fe0af770783a6b76a3fc56867");
        assert.equal(h.short_sha, "7dfd134");
        assert.equal(h.mutable_cache_key, "tobie/webidl/interface-objs.html");
        assert.equal(h.immutable_cache_key, "tobie/webidl/interface-objs/7dfd134.html");
        assert.equal(h.key, "tobie/webidl/interface-objs.html");
        assert.equal(h.key, h.mutable_cache_key);
        process.env.AWS_BUCKET_NAME = "bar"
        assert.equal(h.cache_url, "https://s3.amazonaws.com/bar/tobie/webidl/interface-objs.html");
        h.pr.config = { src_file: "foo.bs" };
        assert.equal(h.github_url, "https://raw.githubusercontent.com/tobie/webidl/7dfd134ee2e6df7fe0af770783a6b76a3fc56867/foo.bs");
        assert.equal(h.rawgit_url, "https://cdn.rawgit.com/tobie/webidl/7dfd134ee2e6df7fe0af770783a6b76a3fc56867/foo.bs");
    });
    
    test("Test Base getters", function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = payload.pull_request;
        let b = new Branch.Base(payload.pull_request.base, pr);
        assert.equal(b.key, "heycam/webidl/gh-pages/3834774.html");
        assert.equal(b.key, b.immutable_cache_key);
        assert.equal(b.cache_url, "https://s3.amazonaws.com/bar/heycam/webidl/gh-pages/3834774.html");
    });
    
    test("Test MergeBase getters", function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = payload.pull_request;
        let b = new Branch.MergeBase("2eb8839fcbc6f04cae8fede477ced39cdbb07329", payload.pull_request.base, pr);
        assert.equal(b.sha, "2eb8839fcbc6f04cae8fede477ced39cdbb07329");
    });
    
    const RESPEC_URL = "https://labs.w3.org/spec-generator/?type=respec&url=https%3A%2F%2Fcdn.rawgit.com%2Ftobie%2Fwebidl%2F7dfd134ee2e6df7fe0af770783a6b76a3fc56867%2F";
    
    test("Test getUrl", function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = payload.pull_request;
        let h = new Branch.Head(payload.pull_request.head, pr);
        h.pr.config = {
            src_file: "Overview.html",
            type: "respec"
        };
        assert.equal(h.getUrl(), RESPEC_URL + "Overview.html");
    });
    
    test("Test getUrl with options", function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = payload.pull_request;
        let h = new Branch.Head(payload.pull_request.head, pr);
        h.pr.config = {
            src_file: "index.html",
            type: "respec",
            params: { "specStatus": "REC" }
        };
        assert.equal(h.getUrl(), RESPEC_URL + "index.html%3FspecStatus%3DREC");
    });
    
    test("Test getUrl with template strings", function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = payload.pull_request;
        let h = new Branch.Head(payload.pull_request.head, pr);
        h.pr.config = {
            src_file: "index.html",
            type: "respec",
            params: { "subtitle": "PR #{{ pull_request.number }}" }
        };
        assert.equal(h.getUrl(), RESPEC_URL + "index.html%3Fsubtitle%3DPR%20%23283");
    });
    
    const BIKESHED_URL = "https://api.csswg.org/bikeshed/?url=https%3A%2F%2Fraw.githubusercontent.com%2Ftobie%2Fwebidl%2F7dfd134ee2e6df7fe0af770783a6b76a3fc56867%2F";
    
    test('Test getUrl basic', function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = payload.pull_request;
        let h = new Branch.Head(payload.pull_request.head, pr);
        h.pr.config = {
            type: "bikeshed",
            src_file: "index.bs"
        };
        assert.equal(h.getUrl(), BIKESHED_URL + "index.bs");
    });
    
    test('Test getUrl with non standard src file name', function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = payload.pull_request;
        let h = new Branch.Head(payload.pull_request.head, pr);
        h.pr.config = {
            src_file: "url.bs",
            type: "bikeshed"
        };
        assert.equal(h.getUrl(), BIKESHED_URL + "url.bs");
    });
    
    test('Test getUrl with specific status', function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = payload.pull_request;
        let h = new Branch.Head(payload.pull_request.head, pr);
        h.pr.config = {
            src_file: "index.bs",
            type: "bikeshed",
            params: { "md-status": "REC" }
        };
        assert.equal(h.getUrl(), BIKESHED_URL +  "index.bs&md-status=REC");
    });
    
    test('Test getUrl using templating', function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = payload.pull_request;
        let h = new Branch.Head(payload.pull_request.head, pr);
        h.pr.config = {
            title: "FOO BAR",
            src_file: "index.bs",
            type: "bikeshed",
            params: {
                "md-title": "{{config.title}} {{owner}}/{{repo}}/{{branch}}#{{pull_request.number}}-{{short_sha}}"
            }
        };
        assert.equal(h.getUrl(), BIKESHED_URL +  "index.bs&md-title=FOO%20BAR%20tobie%2Fwebidl%2Finterface-objs%23283-7dfd134");
    });
    
    test('Test getUrl templating gracefully handles non strings', function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = payload.pull_request;
        let h = new Branch.Head(payload.pull_request.head, pr);
        h.pr.config = {
            src_file: "index.bs",
            type: "bikeshed",
            params: {
                "force": 1
            }
        };
        assert.equal(h.getUrl(), BIKESHED_URL +  "index.bs&force=1");
    });
    
    test('Test urlOptions', function() {
        let config = {
            src_file: "index.bs",
            type: "bikeshed",
            params: {
                "force": 1
            }
        }
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = payload.pull_request;
        let h = new Branch.Head(payload.pull_request.head, pr);
        h.pr.config = config;
        assert.deepEqual(h.urlOptions(), {
            config:       config,
            pull_request: payload.pull_request,
            owner:        "tobie",
            repo:         "webidl",
            branch:       "interface-objs",
            sha:          "7dfd134ee2e6df7fe0af770783a6b76a3fc56867",
            short_sha:    "7dfd134",
            url:          "https://s3.amazonaws.com/bar/tobie/webidl/interface-objs.html"
        });
    });
});