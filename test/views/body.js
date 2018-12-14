"use strict";
const assert = require("assert"),
    BodyView = require("../../lib/views/body");
suite("Body view", function() {
    test("Test getDate", function() {
        let v = new BodyView();
        assert.equal(v.getDate(new Date(0)), "Jan 1, 1970, 12:00 AM UTC");
    });
    
    test("Test lastUpdated", function() {
        let v = new BodyView();
        assert.equal(v.lastUpdated(new Date(0),  "1234567"), "Last updated on Jan 1, 1970, 12:00 AM UTC (1234567)");
    });
});


