"use strict";
const assert = require("assert"),
    SpecDiff = require("../../lib/models/spec-diff"),
    PR = require("../../lib/models/pr");
const payload = require("../fixtures/pr");

suite("SpecDiff model", function() {
    test("Test constructor", function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = payload.pull_request;
        let sp = new SpecDiff(pr.head, pr.base);
        assert(sp instanceof SpecDiff);
    });
    
    test("Test in_same_repo getter", function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = payload.pull_request;
        assert.equal(new SpecDiff(pr.head, pr.base).in_same_repo, false);
        assert(new SpecDiff(pr.head, pr.head).in_same_repo);
    });
    
    test("Test key getter", function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = payload.pull_request;
        assert.equal(new SpecDiff(pr.head, pr.base).key, "heycam/webidl/3834774...tobie:7dfd134.html");
        assert.equal(new SpecDiff(pr.base, pr.base).key, "heycam/webidl/3834774...3834774.html");
    });
});