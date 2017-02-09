"use strict";
var request = require("request");
var S3 = require('aws-sdk/clients/s3');
var s3 = new S3({
    apiVersion: '2006-03-01',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY    
});

let getUrl = (key) => `https://s3.amazonaws.com/${process.env.AWS_BUCKET_NAME}/${key}`;

let cache = (key, url) => {
    var bucket = process.env.AWS_BUCKET_NAME;
    var cachedUrl = getUrl(key);
    return new Promise((resolve, reject) => {
        s3.headObject({
            Bucket: bucket,
            Key: key,
        }, function(err, data) {
            if (data) {
                console.log(`s3: Found ${key}.`)
                console.log(`s3: Available at ${cachedUrl}.`)
                resolve(cachedUrl);
            } else {
                console.log(`request: Fetch ${url}.`)
                request(url, function (error, response, body) {
                    if (error) {
                        reject(error);
                    } else if (response.statusCode != 200) {
                        reject(new Error(`${ response.statusCode } ${ response.statusMessage }`));
                    } else {
                        console.log(`request: Found ${url}.`)
                        console.log(`s3: Attempting to cache ${url} in ${key}.`)
                        s3.putObject({
                            Bucket:       bucket,
                            Key:          key,
                            Body:         body,
                            ContentType:  "text/html;charset=utf-8",
                            CacheControl: "max-age=315569000, immutable"
                        }, function(err, data) {
                            if (data) {
                                console.log(`s3: Succesfully cached ${url} in ${key}.`)
                                console.log(`s3: Available at ${cachedUrl}.`)
                                resolve(cachedUrl);
                            } else {
                                console.log(`s3: Failed to cache ${url} in ${key}.`)
                                reject(err);
                            }
                        });
                    }
                });
            }          
        });
    });
};

module.exports = cache;
module.exports.getUrl = getUrl;