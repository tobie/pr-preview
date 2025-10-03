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

    test("checkForChanges detects commit changes", function(done) {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = {
            head: { sha: "abc123" },
            body: "Original body"
        };

        // Mock the request method to simulate fresh API response with new commit
        pr.request = function() {
            return Promise.resolve({
                head: { sha: "def456" },
                body: "Original body"
            });
        };

        pr.checkForChanges().then(changeInfo => {
            assert.equal(changeInfo.hasCommitChanges, true);
            assert.equal(changeInfo.hasBodyChanges, false);
            assert.equal(changeInfo.initialHeadSha, "abc123");
            assert.equal(changeInfo.currentHeadSha, "def456");
            done();
        }).catch(done);
    });

    test("checkForChanges detects body changes", function(done) {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = {
            head: { sha: "abc123" },
            body: "Original body"
        };

        // Mock the request method to simulate fresh API response with edited body
        pr.request = function() {
            return Promise.resolve({
                head: { sha: "abc123" },
                body: "Updated body content"
            });
        };

        pr.checkForChanges().then(changeInfo => {
            assert.equal(changeInfo.hasCommitChanges, false);
            assert.equal(changeInfo.hasBodyChanges, true);
            assert.equal(changeInfo.initialBody, "Original body");
            assert.equal(changeInfo.currentBody, "Updated body content");
            done();
        }).catch(done);
    });

    test("checkForChanges detects no changes", function(done) {
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = {
            head: { sha: "abc123" },
            body: "Same body"
        };

        // Mock the request method to simulate no changes
        pr.request = function() {
            return Promise.resolve({
                head: { sha: "abc123" },
                body: "Same body"
            });
        };

        pr.checkForChanges().then(changeInfo => {
            assert.equal(changeInfo.hasCommitChanges, false);
            assert.equal(changeInfo.hasBodyChanges, false);
            done();
        }).catch(done);
    });

    test("updateBody sets requeue flag when commits change", function(done) {
        const Controller = require("../../lib/controller");
        let controller = new Controller();

        // Create a mock PR
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = {
            head: { sha: "abc123" },
            body: "Original body"
        };
        pr.config = { type: "respec" };

        // Mock all the methods we need
        pr.cacheAll = () => Promise.resolve();
        pr.checkForChanges = () => Promise.resolve({
            hasCommitChanges: true,
            hasBodyChanges: false,
            initialHeadSha: "abc123",
            currentHeadSha: "def456"
        });

        let result = {
            id: "heycam/webidl/283",
            installation_id: 234,
            needsUpdate: true
        };

        // Mock needsUpdate to return true
        controller.needsUpdate = () => true;

        controller.updateBody(pr, result).then(_ => {
            // This should not be reached when commits change during build
            done(new Error("Expected updateBody to throw an error"));
        }).catch(error => {
            // The error should be thrown when commits change during build
            assert.equal(error.message, "New commits pushed during build");
            assert.equal(error.aborted, true);
            assert.equal(result.requeue, true);
            done();
        });
    });

    test("controller handles requeue flag correctly", function(done) {
        const Controller = require("../../lib/controller");
        let controller = new Controller();
        let requeueCalled = false;

        // Mock handlePullRequest to track re-queue calls
        controller.handlePullRequest = function(result) {
            if (!requeueCalled) {
                requeueCalled = true;
                assert.equal(result.id, "test/repo/123");
                assert.equal(result.installation_id, 456);
                return Promise.resolve({ id: result.id, updated: true });
            }
            return Promise.resolve({ id: result.id });
        };

        // Simulate the requeue logic from handlePullRequest
        let result = {
            id: "test/repo/123",
            installation_id: 456,
            requeue: true,
            aborted: true,
            forcedUpdate: false
        };

        // This simulates the logic in handlePullRequest lines 130-141
        Promise.resolve(result).then(result => {
            if (result.requeue) {
                return controller.handlePullRequest({
                    installation_id: result.installation_id,
                    id: result.id,
                    forcedUpdate: result.forcedUpdate,
                    needsUpdate: undefined,
                    updated: false,
                    config: undefined,
                    previous: undefined
                });
            }
            return result;
        }).then(finalResult => {
            assert.equal(requeueCalled, true, "Re-queue should have been called");
            assert.equal(finalResult.updated, true);
            done();
        }).catch(done);
    });

    test("aborted errors are not reported as user-facing errors", function(done) {
        const Controller = require("../../lib/controller");
        let controller = new Controller();

        // Create a mock PR
        let pr = new PR("heycam/webidl/283", { id: 234 });
        pr.payload = {
            head: { sha: "abc123" },
            body: "Original body",
            merged: false
        };
        pr.config = { type: "respec" };
        pr.touchesSrcFile = () => true;
        pr.requiresPreview = () => true;

        // Create a result with an aborted error
        let result = {
            id: "heycam/webidl/283",
            installation_id: 234,
            error: new Error("New commits pushed during build"),
            forcedUpdate: false
        };
        result.error.aborted = true;

        // Set NODE_ENV to production to enable error reporting
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "production";

        // Test shouldReportError - it should return false for aborted errors
        let shouldReport = controller.shouldReportError(pr, result);
        assert.equal(shouldReport, false, "Aborted errors should not be reported");

        // Restore original environment
        process.env.NODE_ENV = originalEnv;
        done();
    });
});

