var assert = require('assert'),
    cache = require('../lib/cache');

suite('Cache.getUrl', function() {
    test('getUrl(k)', function() {
        assert.equal(cache.getUrl("foo", "abc.html"), "https://s3.amazonaws.com/foo/abc.html")
    });
});