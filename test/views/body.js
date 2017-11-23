"use strict";
const assert = require("assert"),
    BodyView = require("../../lib/views/body");
suite("Body view", function() {
    test("Test getDate", function() {
        let v = new BodyView();
        assert.equal(v.getDate(new Date(0)), "Last updated on Jan 1, 1970, 12:00 AM GMT");
    });
});