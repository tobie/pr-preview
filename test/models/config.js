"use strict";
const assert = require("assert"),
    Config = require("../../lib/models/config");

suite("Config validation", function() {

    test("empty object", function() {
        assert.throws(_ => Config.validate({}));
    });
    
    test("null/undef", function() {
        assert.throws(_ => Config.validate());
        assert.throws(_ => Config.validate(null));
    });
    
    test("inccorect type", function() {
        assert.throws(_ => Config.validate({
            src_file: "foo.bs",
            type: "test"
        }));
    });
    
    test("correct type, no params", function() {
        assert.doesNotThrow(_ => Config.validate({
            src_file: "foo.bs",
            type: "respec"
        }));
        
        assert.doesNotThrow(_ => Config.validate({
            src_file: "foo.bs",
            type: "ReSpec"
        }));
        
        assert.doesNotThrow(_ => Config.validate({
            src_file: "foo.bs",
            type: "bikeshed"
        }));
        
        assert.doesNotThrow(_ => Config.validate({
            src_file: "foo.bs",
            type: "Bikeshed"
        }));
    });
    
    test("correct type, empty params", function() {
        assert.doesNotThrow(_ => Config.validate({
            src_file: "foo.bs",
            type: "respec",
            params: {}
        }));
    });
    
    test("correct type, primitive params", function() {
        assert.doesNotThrow(_ => Config.validate({
            src_file: "foo.bs",
            type: "respec",
            params: {
                "foo": 123,
                "bar": true,
                "foobar": "a string",
                "baz": null
            }
        }));
    });
    
    test("correct type, forbidden params", function() {
        assert.throws(_ => Config.validate({
            src_file: "foo.bs",
            type: "respec",
            params: {
                "foo": {}
            }
        }));
    });
    
    test("post-processing, correct name", function() {
        assert.doesNotThrow(_ => Config.validate({
            src_file: "foo.bs",
            type: "respec",
            post_processing: {
                "name": "emu-algify"
            }
        }));
    });
    
    test("post-processing, incorrect name", function() {
        assert.throws(_ => Config.validate({
            src_file: "foo.bs",
            type: "respec",
            post_processing: {
                "name": "foo"
            }
        }));
    });
    
    test("post-processing, missing name", function() {
        assert.throws(_ => Config.validate({
            src_file: "foo.bs",
            type: "respec",
            post_processing: {}
        }));
    });
    
    test("post-processing, correct config options", function() {
        assert.doesNotThrow(_ => Config.validate({
            src_file: "foo.bs",
            type: "respec",
            post_processing: {
                "name": "emu-algify",
                "config": {
                    "foo": 123,
                    "bar": [2, "foo", false],
                    "foobar": { foo: 123 },
                    "baz": null
                }
            }
        }));
    });
});

suite("Config.addDefault", function() {
    test("Defaults md-warning to 'not ready' for Bikeshed configs", function() {
        assert.deepEqual({
            type: "bikeshed",
            params: { "md-warning": "not ready" }
        }, Config.addDefault({ type: "bikeshed" }));
    });

    test("Default isPreview param to true for ReSpec configs", function() {
        assert.deepEqual({
            type: "respec",
            params: { isPreview: true }
        }, Config.addDefault({ type: "respec" }));
    });
    
    test("Defaults multipage param to true for Wattsi configs", function() {
        assert.deepEqual({
            type: "wattsi",
            multipage: true
        }, Config.addDefault({ type: "wattsi" }));
    });

    test("Defaults do not overide actual config", function() {
        assert.deepEqual({
            type: "bikeshed",
            params: { "md-warning": "boo" }
        }, Config.addDefault({ type: "bikeshed",  params: { "md-warning": "boo" } }));

        assert.deepEqual({
            type: "respec",
            params: { isPreview: false }
        }, Config.addDefault({ type: "respec", params: { isPreview: false } }));

        assert.deepEqual({
            type: "wattsi",
            multipage: false
        }, Config.addDefault({ type: "wattsi", multipage: false }));
    });
});

