"use strict";

const request = require("request");

module.exports = (url) => {
    return new Promise((resolve, reject) => {
        request(url, function (error, response, body) {
            if (error) {
                error.data = { request_url: url };
                reject(error);
            } else if (response.statusCode >= 400) {
                var err = new Error(`${ response.statusCode } ${ response.statusMessage }`);
                try { err.data = JSON.parse(body); } catch (e) { err.data = {}; }
                err.data.request_url = url;
                reject(err);
            } else {
                resolve(body);
            }
        });
    });
};