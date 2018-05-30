var assert = require('assert'),
    Wattsi = require('../lib/wattsi-client');

suite('WattsiClient.filter', function() {
    var w = new Wattsi();
    test('A single file changed', function() {
        var lines = ["Files ./foo/bar/baz/filename.html and ~/dir/filename.html differ"]
        assert.deepEqual(w.filter(lines), ["filename.html"]);
    });
    
    test('Multiple files changed', function() {
        var lines = [
            "Files ./foo/bar/baz/filename.html and ~/dir/filename.html differ",
            "Files ./foo/bar/baz/foo.html and ~/dir/foo.html differ",
            "Files ./foo/bar/baz/bar.html and ~/dir/bar.html differ"
        ];
        assert.deepEqual(w.filter(lines), ["filename.html", "foo.html", "bar.html"]);
    });
    
    test('A file was removed', function() {
        var lines = [
            "Files ./foo/bar/baz/filename.html and ~/dir/filename.html differ",
            "Only in ./foo/bar/baz: foobar.html",
            "Files ./foo/bar/baz/foo.html and ~/dir/foo.html differ",
            "Files ./foo/bar/baz/bar.html and ~/dir/bar.html differ"
        ];
        assert.deepEqual(w.filter(lines), ["filename.html", "foo.html", "bar.html"]);
    });
});

suite('WattsiClient.findFilesOnlyIn', function() {
    var w = new Wattsi();
    test('No files removed or added', function() {
        var lines = ["Files ./foo/bar/baz/filename.html and ~/dir/filename.html differ"]
        assert.deepEqual(w.findFilesOnlyIn("./foo/bar/baz", lines), []);
    });
    
    test('A file was only in the directory', function() {
        var lines = [
            "Files ./foo/bar/baz/filename.html and ~/dir/filename.html differ",
            "Only in ./foo/bar/baz: foobar.html",
            "Files ./foo/bar/baz/foo.html and ~/dir/foo.html differ",
            "Files ./foo/bar/baz/bar.html and ~/dir/bar.html differ"
        ];
        assert.deepEqual(w.findFilesOnlyIn("./foo/bar/baz", lines), ["foobar.html"]);
    });
    
    test('Multiple files were only in the directory', function() {
        var lines = [
            "Only in ./foo/bar/baz: foobar.html",
            "Only in ./foo/bar/baz: foo .html",
        ];
        assert.deepEqual(w.findFilesOnlyIn("./foo/bar/baz", lines), ["foobar.html", "foo .html"]);
    });
    
    test('A file was only in another directory', function() {
        var lines = [
            "Only in ./foo/bar/baz: bar.html",
            "Only in ./another/dir: foo.html",
        ];
        assert.deepEqual(w.findFilesOnlyIn("./foo/bar/baz", lines), ["bar.html"]);
    });
});
