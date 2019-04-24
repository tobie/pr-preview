"use strict";

const request = require("request");

module.exports = (url, service) => {
    return new Promise((resolve, reject) => {
        request(url, function (error, response, body) {
            if (error) {
                error.data = { request_url: url, service: service };
                reject(error);
            } else if (response.statusCode >= 400) {
                var err = new Error(`${ response.statusCode } ${ response.statusMessage }`);
                try { err.data = JSON.parse(body); } catch (e) { err.data = {}; }
                err.data.request_url = url;
                err.data.service = service;
                reject(err);
            } else {
                resolve(body);
            }
        });
    });
};