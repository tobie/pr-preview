"use strict";

const stripAnsi = require("strip-ansi");

module.exports = async (urlObj, service) => {
    if (typeof urlObj == "string") {
        urlObj = { url: urlObj };
    }

    const options = {
        ...urlObj,
        headers: {
            "User-Agent": "pr-preview",
            ...urlObj.headers
        }
    };

    try {
        const response = await fetch(urlObj.url, options);

        if (!response.ok) {
            const body = await response.text();
            const err = new Error(`${response.status} ${response.statusText}`);
            try {
                err.data = JSON.parse(body);
            } catch (e) {
                err.data = { error: stripAnsi(body) };
            }
            err.data.request_url = urlObj.url;
            err.data.service = service;
            throw err;
        }

        return await response.text();
    } catch (error) {
        if (error.data) {
            // Already processed error from above
            throw error;
        }
        // Network or other fetch error
        error.data = { request_url: urlObj.url, service: service };
        throw error;
    }
};
