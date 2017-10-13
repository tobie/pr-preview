var assert = require('assert'),
    postProcessor = require('../lib/post-processor');

suite('postProcessor', function() {
    test('returns noop by default', function() {
        assert.equal(postProcessor(), postProcessor.noop);
    });
    
    test('does not return noop provided the right config', function() {
        assert.notEqual(postProcessor({name: "emu-algify"}), postProcessor.noop);
        assert.notEqual(postProcessor({name: "emu-algify", options: {}}), postProcessor.noop);
        assert.notEqual(postProcessor({name: "emu-algify", options: { foo: 123 }}), postProcessor.noop);
    });
    
    test('supports emu-algify post-processor', function() {
        assert.doesNotThrow(_ => postProcessor({name: "emu-algify"}));
    });
    
    test('supports webidl-grammar post-processor', function() {
        assert.doesNotThrow(_ => postProcessor({name: "webidl-grammar"}));
    });
    
    test('throws for incorrect post-processors', function() {
        assert.throws(_ => postProcessor({name: "foo"}));
    });
});
