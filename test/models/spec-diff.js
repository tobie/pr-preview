"use strict";
const assert = require("assert"),
    SpecDiff = require("../../lib/models/spec-diff"),
    PR = require("../../lib/models/pr"),
    File = require("../../lib/models/file");

const payload = require("../fixtures/pr");
const payload2 = require("../fixtures/pr2");

function prFixture(config = {}) {
    let pr = new PR("heycam/webidl/283", { id: 234 });
    pr.payload = payload.pull_request;
    pr.merge_base_sha = "c2fd513de33ea3f053495f4e135614db6e6aa617";
    let specConfig = {type: "bikeshed", src_file: "foo.bs", ...config};
    pr.config = {specs: [specConfig]};
    return pr;
}

suite("SpecDiff model", function() {
    test("Test constructor", function() {
        let pr = prFixture();
        let sp = new File(pr, pr.specs[0]).diff;
        assert(sp instanceof SpecDiff);
    });
    
    test("Test in_same_repo getter", function() {
        let pr = prFixture();
        let sp = new File(pr, pr.specs[0]).diff;
        assert.equal(sp.in_same_repo, false);
        
        pr = prFixture();
        pr.payload = payload2.pull_request;
        sp = new File(pr, pr.specs[0]).diff;
        assert(sp.in_same_repo);
    });
    
    test("Test key getter", function() {
        let pr = prFixture();
        let sp = new File(pr, pr.specs[0]).diff;
        assert.equal(sp.key, "heycam/webidl/283/c2fd513...tobie:7dfd134.html");
        
        pr = prFixture();
        pr.payload = payload2.pull_request;
        sp = new File(pr, pr.specs[0]).diff;
        assert.equal(sp.key, "heycam/webidl/283/c2fd513...7dfd134.html");
    });
    
    test("Test key getter for specific page names", function() {
        let pr = prFixture();
        let sp = new File(pr, pr.specs[0], "foo.html").diff;
        assert.equal(sp.key, "heycam/webidl/283/c2fd513...tobie:7dfd134/foo.html");
    });
});