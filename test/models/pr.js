"use strict";
const assert = require("assert"),
    PR = require("../../lib/models/pr");
const payload = require("../fixtures/pr");

suite("PR model", function() {
 
    test("constructor throws when no args are present", function() {
        assert.throws(_ => new PR(), TypeError);
    });
    
    test("constructor throws when an incorrect arg is present", function() {
        assert.throws(_ => new PR({}), TypeError);
    });
    
    test("constructor throws when an incorrect arg is present", function() {
        assert.throws(_ => new PR("foo", 123), TypeError);
    });
    
    test("constructor doesn't throw when the right arguments is present", function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        assert(pr instanceof PR);
    });

const BODY = `* Extract legacy callback interface objects
  out of interface objects. Closes #78.
* Clarify that legacy callback interfaces are function objects.
* Give them a length property. Closes #279. Closes #83.
* Require new for Named Constructors. Closes #275.
* Rely on ES abstract operations for defining,
  named constructors, interface objects, and
  legacy callback interface objects.
* Disallow using the [NoInterfaceObject] on
  callback interfaces with constants.
* Don't require an interface prototype object for constants.
  Callback interfaces do not have an interface prototype object.
  Their constants sit on the legacy callback interface object itself.
  Closes #281.

<!--
    This comment and the below content is programmatically generated.
    You may add a comma-separated list of anchors you'd like a
    direct link to below (e.g. #idl-serializers, #idl-sequence):
    #foo, #bar
    Don't remove this comment or modify anything below this line.
    If you don't want a preview generated for this pull request,
    just replace the whole of this comment's content by \"no preview\"
    and remove what's below.
-->
***
[Preview](https://rawcdn.githack.com/tobie/webidl/7dfd134/index.html) | [Diff w/ current ED](https://services.w3.org/htmldiff?doc1=https%3A%2F%2Fheycam.github.io%2Fwebidl%2F&doc2=https%3A%2F%2Frawcdn.githack.com%2Ftobie%2Fwebidl%2F7dfd134%2Findex.html) | [Diff w/ base](https://services.w3.org/htmldiff?doc1=https%3A%2F%2Fcdn.rawgit.com%2Fheycam%2Fwebidl%2F3834774%2Findex.html&doc2=https%3A%2F%2Frawcdn.githack.com%2Ftobie%2Fwebidl%2F7dfd134%2Findex.html)`;
    
    test("getters", function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        assert.deepEqual(pr.installation, { id: 234 });
        assert.equal(pr.number, 283);
        assert.equal(pr.owner, "heycam");
        assert.equal(pr.repo, "webidl");
        assert.equal(pr.id, "heycam/webidl/283");
        pr.payload = payload.pull_request;
        assert.equal(pr.body, BODY);
    });
    
    test("get/set config", function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        assert.throws(_ => pr.config, Error);
        let c = {};
        assert.equal(pr.config = c, c);
        assert.equal(pr.config, c);
    });
    
    test("get/set files", function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        assert.throws(_ => pr.files, Error);
        let f = [{}];
        assert.equal(pr.files = f, f);
        assert.equal(pr.files, f);
    });
    
    test("get/set commits", function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        assert.throws(_ => pr.commits, Error);
        let c = {};
        assert.equal(pr.commits = c, c);
        assert.equal(pr.commits, c);
    });
    
    test("requiresPreview()", function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = payload.pull_request;
        assert(pr.requiresPreview());
        pr = new PR("heycam/webidl/283", { id: 234 });
        let clone = JSON.parse(JSON.stringify(payload.pull_request))
        clone.body = "some content <!--no preview-->";
        pr.payload = clone;
        assert.equal(pr.requiresPreview(), false);
    });
    
    test("touchesSrcFile()", function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.files = require("../fixtures/files");
        pr.config = { src_file: "index.bs" };
        assert(pr.touchesSrcFile());
        pr = new PR("heycam/webidl/283", { id: 234 });
        pr.files = require("../fixtures/files");
        pr.config = { src_file: "foo.html" };
        assert.equal(pr.touchesSrcFile(), false);
    });
    
    test("get processor", function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.config = { type: "bikeshed" };
        assert.equal(pr.processor, "bikeshed");
    });
    
    
    test("processor is always lowercase", function() {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.config = { type: "Bikeshed" };
        assert.equal(pr.processor, "bikeshed");
    });
});

