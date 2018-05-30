var assert = require('assert'),
    Wattsi = require('../lib/wattsi-client');

suite('WattsiClient.filter', function() {
    var w = new Wattsi();
    test('A single file changed', function() {
        var stdout = "Files ./foo/bar/baz/filename.html and ~/dir/filename.html differ\n"
        assert.deepEqual(w.filter(stdout), ["filename.html"]);
    });
    
    test('Multiple files changed', function() {
        var stdout = "Files ./foo/bar/baz/filename.html and ~/dir/filename.html differ\n";
        stdout += "Files ./foo/bar/baz/foo.html and ~/dir/foo.html differ\n";
        stdout += "Files ./foo/bar/baz/bar.html and ~/dir/bar.html differ\n";
        assert.deepEqual(w.filter(stdout), ["filename.html", "foo.html", "bar.html"]);
    });
    
    test('A file was removed', function() {
        var stdout = "Files ./foo/bar/baz/filename.html and ~/dir/filename.html differ\n";
        stdout += "Only in ./foo/bar/baz: foobar.html\n";
        stdout += "Files ./foo/bar/baz/foo.html and ~/dir/foo.html differ\n";
        stdout += "Files ./foo/bar/baz/bar.html and ~/dir/bar.html differ\n";
        assert.deepEqual(w.filter(stdout), ["filename.html", "foo.html", "bar.html"]);
    });
});
