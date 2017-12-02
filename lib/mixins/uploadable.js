"use strict";

const postProcessor = require("../post-processor");
const fs = require("fs");

module.exports = (superclass) => class extends superclass {  
    fetch() {
        console.log(`Read file: ${ this.filepath }`);
        var postProcess = postProcessor(this.pr.postProcessingConfig) || postProcessor.noop;
        return new Promise((resolve, reject) => {
            fs.readFile(this.filepath, "utf8", (err, body) => {
                if (err) {
                    err.data = { filepath: this.filepath };
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        }).then(postProcess);
    }
};