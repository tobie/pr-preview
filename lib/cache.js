"use strict";
var request = require("request");
var S3 = require('aws-sdk/clients/s3');
var s3 = new S3({
    apiVersion: '2006-03-01',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY    
});

var whatwgS3 = new S3({
    apiVersion: '2006-03-01',
    accessKeyId: process.env.WHATWG_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.WHATWG_AWS_SECRET_ACCESS_KEY
});

let getUrl = (bucket, key) => {
    if (bucket == process.env.WHATWG_AWS_BUCKET_NAME) {
        return `https://${ bucket }/${ key }`
    }
    return `https://${ bucket }.s3.amazonaws.com/${ key }`;
}
let getS3 = (bucket) => bucket == "pr-preview" ? s3 : whatwgS3;

let immutable = (bucket, key, fetch) => {
    console.log(`s3: Bucket name: ${bucket}.`);
    var cachedUrl = getUrl(bucket, key);
    return new Promise((resolve, reject) => {
        getS3(bucket).headObject({
            Bucket: bucket,
            Key: key,
        }, (err, data) => {
            if (data) {
                console.log(`s3: Found ${key}.`)
                console.log(`s3: Available at ${cachedUrl}.`)
                resolve(cachedUrl);
            } else {
                fetch().then(output => {
                    console.log(`s3: Attempting to cache ${key}.`)
                    getS3(bucket).putObject({
                        Bucket:       bucket,
                        Key:          key,
                        Body:         output,
                        ContentType:  "text/html;charset=utf-8",
                        CacheControl: "max-age=315569000, immutable"
                    }, (err, data) => {
                        if (data) {
                            console.log(`s3: Succesfully cached ${key}.`)
                            console.log(`s3: Available at ${cachedUrl}.`)
                            resolve(cachedUrl);
                        } else {
                            console.log(`s3: Failed to cache ${key}.`)
                            reject(err);
                        }
                    });
                }, reject);
            }
        });
    });
};

let mutable = (bucket, key, fetch) => {
    var cachedUrl = getUrl(bucket, key);
    console.log(`s3: Bucket name: ${bucket}.`);
    return fetch().then(output => {
        console.log(`s3: Attempting to cache ${key}.`);
        return new Promise((resolve, reject) => {
            getS3(bucket).putObject({
                Bucket:       bucket,
                Key:          key,
                Body:         output,
                ContentType:  "text/html;charset=utf-8",
                CacheControl: "no-cache, no-store"
            }, (err, data) => {
                if (data) {
                    console.log(`s3: Succesfully cached ${key}.`)
                    console.log(`s3: Available at ${cachedUrl}.`)
                    resolve(cachedUrl);
                } else {
                    console.log(`s3: Failed to cache ${key}.`)
                    reject(err);
                }
            });
        });
    });
};

module.exports.mutable = mutable;
module.exports.immutable = immutable;
module.exports.getUrl = getUrl;