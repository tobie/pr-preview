"use strict";

const request = require("request");
const os = require("os");
const fs = require("fs");
const path = require("path");
const mkdirpPromise = require("mkdirp-promise");
const exec = require('child_process').exec;

const CANIUSE_URL = "https://raw.githubusercontent.com/Fyrd/caniuse/master/data.json";
const W3CBUGS_URL = "https://www.w3.org/Bugs/Public/buglist.cgi?columnlist=bug_file_loc,short_desc&query_format=advanced&resolution=---&ctype=csv";
const WATTSI_URL = "https://build.whatwg.org/wattsi";
class WattsiClient {
    constructor(pr) {
        this.pr = pr;
    }
    
    get number() {
        return String(this.pr.number);
    }

    get dirPath() {
        return this._dirPath = this._dirPath || path.join(os.tmpdir(), "pr-preview", "whatwg", "html", this.number);
    }
    
    get mergeBaseZipPath() {
        return path.join(this.dirPath, `${ this.pr.merge_base_sha }.zip`);
    }
    
    get headZipPath() {
        return path.join(this.dirPath, `${ this.pr.head_sha }.zip`);
    }
    
    get mergeBaseUnzipDir() {
        return path.join(this.dirPath, this.pr.merge_base_sha);
    }
    
    get headUnzipDir() {
        return path.join(this.dirPath, this.pr.head_sha);
    }
    
    get mergeBaseDirPath() {
        return path.join(this.mergeBaseUnzipDir, "multipage-html");
    }
    
    get headDirPath() {
        return path.join(this.headUnzipDir, "multipage-html");
    }
    
    mergeBasePath(f) {
        return path.join(this.mergeBaseDirPath, f);
    }
    
    headPath(f) {
        return path.join(this.headDirPath, f);
    }
    
    githubSource(sha) {
        return `https://raw.githubusercontent.com/whatwg/html/${ sha }/source`;
    }

    request(url, onerror) {
        return request(url).on('error', err => {
            err.data = { error: "Network error", request_url: url };
            onerror(err);
        }).on('response', response => {
            if (response.statusCode >= 400) {
                 let err = new Error(`HTTP Error: ${ response.statusCode } ${ response.statusMessage }`);
                 err.data = { request_url: url };
                 onerror(err);
            }
        });
    }
    
    fetchZip(sha, p) {
        return new Promise((resolve, reject) => {
            let error = null;
            let onerror = err => { reject(err); r.destroy(); };
            let r = request.post({
                url: WATTSI_URL,
                formData: {
                    source: this.request(this.githubSource(sha), onerror),
                    caniuse: this.request(CANIUSE_URL, onerror),
                    w3cbugs: this.request(W3CBUGS_URL, onerror)
                }
            });
            r.on('error', err => {
                err.data = {
                    error: "Network error while accessing Wattsi server",
                    request_url: WATTSI_URL
                };
                reject(err);
            });
            r.on('response', response => {
                if (response.statusCode != 200) {
                    error = new Error("Wattsi server error");
                    error.data = { request_url: WATTSI_URL };
                }
            });
            let writeStream = fs.createWriteStream(p);
            writeStream.on("close", _ => {
                if (error) {
                    fs.readFile(p, "utf8", (err, message) => {
                        if (!err) { error.data.error = message; }
                        reject(error);
                    });
                } else {
                    resolve();
                }
            });
            r.pipe(writeStream);
        });
    }
    
    fetch() {
        return mkdirpPromise(this.dirPath).then(_ => {
            return Promise.all([
                this.fetchZip(this.pr.head_sha, this.headZipPath),
                this.fetchZip(this.pr.merge_base_sha, this.mergeBaseZipPath)
            ]);
        });
    }

    unzip() {
        return new Promise((resolve, reject) => {
            exec(`rm -rf ${ this.headUnzipDir }`, _ => {
                exec(`unzip ${ this.headZipPath } -d ${ this.headUnzipDir }`, (err, stdout, stderr) => {
                    if (err) { return reject(err); }
                    exec(`rm -rf ${ this.mergeBaseUnzipDir }`, _ => {
                        exec(`unzip ${ this.mergeBaseZipPath } -d ${ this.mergeBaseUnzipDir }`, (err, stdout, stderr) => {
                            if (err) { return reject(err); }
                            resolve();
                        });
                    });
                });
            });
        });
    }
    
    diff() {
        return new Promise((resolve, reject) => {
            exec(`diff -qr --exclude=*.json ${ this.headDirPath } ${ this.mergeBaseDirPath }`, (err, stdout, stderr) => {
                if (err && err.code > 1) {
                    reject(err);
                } else {
                    this.filenames = this.filter(stdout);
                    resolve(this.filenames);
                }
            });
        });
    }
    
    getUnchangedFilenames(filenames) {
        return new Promise((resolve, reject) => {
            fs.readdir(this.headDirPath, (err, files) => {
                if (err) {
                    reject(err);
                } else {
                    this.unchangedFiles = files.filter(file => filenames.indexOf(file) < 0);
                    resolve(this.unchangedFiles);
                }
            });
        });
    }
    
    filter(stdout) {
        return stdout.trim().split("\n").map(txt => {
            txt = txt.replace(/Files ([^\s]+).*/, "$1");
            return path.basename(txt);
        });
    }
    
    getFilenames() {
        return this.fetch()
            .then(_ => this.unzip())
            .then(_ => this.diff())
            .then(filenames => {
                return this.getUnchangedFilenames(filenames).then(_ => filenames);
            });
    }
    
    cleanup() {
        return new Promise((resolve, reject) => {
            exec(`rm -rf ${this.dir}`, (err, stdout, stderr) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

module.exports = WattsiClient;
