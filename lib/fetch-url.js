"use strict";

const stripAnsi = require("strip-ansi");
const request = require("request");

module.exports = (urlObj, service) => {
    return new Promise((resolve, reject) => {
        if (typeof urlObj == "string") {
            urlObj = { url: urlObj };
        }
        urlObj.headers = { "User-Agent": "pr-preview" };
        request(urlObj, function (error, response, body) {
            if (error) {
                error.data = { request_url: urlObj.url, service: service };
                reject(error);
            } else if (response.statusCode >= 400) {
                var err = new Error(`${ response.statusCode } ${ response.statusMessage }`);
                try {
                    err.data = JSON.parse(body);
                } catch (e) {
                    err.data = { error: stripAnsi(body) };
                }
                err.data.request_url = urlObj.url;
                err.data.service = service;
                reject(err);
            } else {
                resolve(body);
            }
        });
    });
};
