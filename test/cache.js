var assert = require('assert'),
    cache = require('../lib/cache');

suite('Cache.getUrl', function() {
    test('getUrl(k)', function() {
        process.env.AWS_BUCKET_NAME = "foo"
        assert.equal(cache.getUrl("abc.html"), "https://s3.amazonaws.com/foo/abc.html")
    });
});