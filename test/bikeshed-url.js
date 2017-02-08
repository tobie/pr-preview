var assert = require('assert'),
    bikeshedUrl = require('../lib/bikeshed-url');
const fixtures = require("./fixtures/pr").pull_request;

suite('Bikeshed URLs', function() {
    var URL = "https://api.csswg.org/bikeshed/?url=https%3A%2F%2Fraw.githubusercontent.com%2Ftobie%2Fwebidl%2F7dfd134ee2e6df7fe0af770783a6b76a3fc56867%2F";
    test('Basic URL', function() {
        assert.equal(
            bikeshedUrl({
                config: { src_file: "index.bs" },
                pull_request: fixtures,
                owner:        fixtures.head.repo.owner.login,
                repo:         fixtures.head.repo.name,
                branch:       fixtures.head.ref,
                sha:          fixtures.head.sha,
                short_sha:    fixtures.head.sha.substr(0, 7)
            }),
            URL + "index.bs"
        )
    });
    
    test('Basic URL with non standard src file name', function() {
        assert.equal(
            bikeshedUrl({
                config: { src_file: "url.bs" },
                pull_request: fixtures,
                owner:        fixtures.head.repo.owner.login,
                repo:         fixtures.head.repo.name,
                branch:       fixtures.head.ref,
                sha:          fixtures.head.sha,
                short_sha:    fixtures.head.sha.substr(0, 7)
            }),
            URL + "url.bs"
        )
    });
    
    test('Specific status', function() {
        assert.equal(
            bikeshedUrl({
                config: {
                    src_file: "index.bs",
                    bikeshed_parameters: { "md-status": "REC" }
                },
                pull_request: fixtures,
                owner:        fixtures.head.repo.owner.login,
                repo:         fixtures.head.repo.name,
                branch:       fixtures.head.ref,
                sha:          fixtures.head.sha,
                short_sha:    fixtures.head.sha.substr(0, 7)
            }),
            URL + "index.bs&md-status=REC"
        )
    });
    
    test('Specific status using templating', function() {
        assert.equal(
            bikeshedUrl({
                config: {
                    title: "FOO BAR",
                    src_file: "index.bs",
                    bikeshed_parameters: {
                        "md-title": "{{config.title}} {{owner}}/{{repo}}/{{branch}}#{{pull_request.number}}-{{short_sha}}"
                    }
                },
                pull_request: fixtures,
                owner:        fixtures.head.repo.owner.login,
                repo:         fixtures.head.repo.name,
                branch:       fixtures.head.ref,
                sha:          fixtures.head.sha,
                short_sha:    fixtures.head.sha.substr(0, 7)
            }),
            URL + "index.bs&md-title=FOO%20BAR%20tobie%2Fwebidl%2Finterface-objs%23283-7dfd134"
        )
    });
});