"use strict";
const gh = require("simple-github");
const jwt = require("jsonwebtoken");
const GH_API = require("./GH_API");

const CERT = process.env.GITHUB_INTEGRATION_KEY;  // get private key
const ID = process.env.GITHUB_INTEGRATION_ID;
const GH_TOKEN = process.env.GITHUB_TOKEN;

let sign = (exp) => {
    return jwt.sign({ iss: ID }, CERT, { algorithm: 'RS256', expiresIn: exp });
};

let headers = token => {
    return {
        "Authorization": `Bearer ${ token }`,
        "Accept": "application/vnd.github.machine-man-preview+json"
    };
};

let getAuthHeaders = (payload) => {
    if (payload.installation) {
        return gh({
            headers: headers(sign("5m"))
        }).request(GH_API.POST_INSTALLATION_TOKEN, {
            installation_id: payload.installation.id
        }).then(installation => headers(installation.token));
    }
    return Promise.resolve({ "Authorization": `token ${ GH_TOKEN }` });
};

module.exports = getAuthHeaders;
