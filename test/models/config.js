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

    test("Defaults do not overide actual config", function() {
        assert.deepEqual({
            type: "bikeshed",
            params: { "md-warning": "boo" }
        }, Config.addDefault({ type: "bikeshed",  params: { "md-warning": "boo" } }));
        assert.deepEqual({
            type: "respec",
            params: { isPreview: false }
        }, Config.addDefault({ type: "respec", params: { isPreview: false } }));
    });
});

