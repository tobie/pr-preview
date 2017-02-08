var assert = require('assert'),
    bikeshedUrl = require('../lib/bikeshed-url');
const fixtures = require("./fixtures/pr").pull_request;

suite('Bikeshed URLs', function() {
    test('Basic URL', function() {
        assert.equal(
            bikeshedUrl({ src_file: "index.bs" }, fixtures.head),
            "https://api.csswg.org/bikeshed/?url=https%3A%2F%2Fraw.githubusercontent.com%2Ftobie%2Fwebidl%2F7dfd134ee2e6df7fe0af770783a6b76a3fc56867%2Findex.bs"
        )
    });
    
    test('Basic URL with non standard src file name', function() {
        assert.equal(
            bikeshedUrl({ src_file: "url.bs" }, fixtures.head),
            "https://api.csswg.org/bikeshed/?url=https%3A%2F%2Fraw.githubusercontent.com%2Ftobie%2Fwebidl%2F7dfd134ee2e6df7fe0af770783a6b76a3fc56867%2Furl.bs"
        )
    });
    
    test('Specific status', function() {
        assert.equal(
            bikeshedUrl({
                src_file: "index.bs",
                bikeshed_parameters: {
                    "md-status": "REC"
                }
            }, fixtures.head),
            "https://api.csswg.org/bikeshed/?url=https%3A%2F%2Fraw.githubusercontent.com%2Ftobie%2Fwebidl%2F7dfd134ee2e6df7fe0af770783a6b76a3fc56867%2Findex.bs&md-status=REC"
        )
    });
});