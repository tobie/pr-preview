"use strict";
const assert = require("assert"),
    ViewError = require("../../lib/views/error");
suite("Error view", function() {
    test("Test render", function() {
        let v = new ViewError();
        assert.equal(v.title({name: "Error", message: "Oops!"}), "### :boom: Error: Oops! :boom: ###");
    });
});