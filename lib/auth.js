"use strict";
const gh = require("simple-github");
const jwt = require("jsonwebtoken");

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

let getAuthHeaders = (installation, options) => {
    if (installation) {
        return gh({
            debug: options && options.debug,
            headers: headers(sign("5m"))
        }).request("POST /app/installations/:installation_id/access_tokens", {
            installation_id: installation.id
        }).then(installation => headers(installation.token));
    }
    return Promise.resolve({ "Authorization": `token ${ GH_TOKEN }` });
};

module.exports = getAuthHeaders;
