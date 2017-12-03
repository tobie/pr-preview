"use strict";

const Head = require("./branch").Head;
const MergeBase = require("./branch").MergeBase;
const WattsiHead = require("./branch").WattsiHead;
const WattsiMergeBase = require("./branch").WattsiMergeBase;
const SpecDiff = require("./spec-diff");
const NoSpecDiff = require("./spec-diff").NoSpecDiff;

class File {
    constructor(pr, filename) {
        this._pr = pr;
        this._filename = filename;
    }
    
    get pr() {
        return this._pr;
    }

    get head() {
        return this._head = this._head || Head.fromPR(this.pr, this.filename);
    }
    
    get merge_base() {
        return this._merge_base = this._merge_base || MergeBase.fromPR(this.pr, this.filename);
    }
    
    get filename() {
        return this._filename;
    }
    
    get isRoot() {
        return !this.filename;
    }
    
    get diff() {
        return this._diff = this._diff || new SpecDiff(this.head, this.merge_base, this.filename);
    }

    cache() {
        return Promise.all([this.head.cache(), this.merge_base.cache()])
            .then(_ => this.diff.cache());
    } 
}

class WattsiFile extends File {
    constructor(pr, wattsi, filename) {
        super(pr, filename);
        console.log("this.filename", this.filename);
        this._wattsi = wattsi;
    }

    get head() {
        return this._head = this._head ||
            WattsiHead.fromPR(this.pr, this._wattsi.headPath(this.filename), this.filename);
    }
    
    get merge_base() {
        return this._merge_base = this._merge_base ||
            WattsiMergeBase.fromPR(this.pr, this._wattsi.mergeBasePath(this.filename), this.filename);
    }
}

class UnchangedWattsiFile extends WattsiFile {
    get diff() {
        return this._diff = this._diff || new NoSpecDiff(this.head, this.merge_base, this._wattsi.mergeBasePath(this.filename), this.filename);
    }

    cache() {
        return this.head.cache()
            .then(_ => this.diff.cache());
    } 
}

module.exports = File;
module.exports.WattsiFile = WattsiFile;
module.exports.UnchangedWattsiFile = UnchangedWattsiFile;
