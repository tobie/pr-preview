"use strict";

const scanIncludes = require("../scan-includes");
const File = require("./file");
const { WattsiFile, AddedWattsiFile, RemovedWattsiFile, UnchangedWattsiFile } = File;
const WattsiClient = require("../wattsi-client");
const { Head } = require("./branch");

class SpecBuild {
    constructor(pr, config) {
        this.pr = pr;
        this.config = config;
        this.processor = config.type;
        this.params = config.params;
        this.src_file = config.src_file;
        this.includes = [];
        this.postProcessingConfig = config.post_processing;
    }

    async requestIncludes() {
        this.includes = await scanIncludes(Head.fromPR(this.pr, this).github_repo_url, this.src_file, this.processor);
    }

    touchesSrcFile(modifiedFiles) {
        return modifiedFiles.some(f => f.filename === this.src_file || this.includes.includes(f.filename));
    }

    async getPreviewFiles() {
        if (this.processor == "wattsi") {
            this.wattsi = new WattsiClient(this.pr, this);
            await this.wattsi.getFilenames();

            this.preview_files = [];
            this.unchanged_files = [];
            this.wattsi.modifiedFiles.forEach(f => {
                this.preview_files.push(new WattsiFile(this.pr, this, this.wattsi, f));
            });
            this.wattsi.addedFiles.forEach(f => {
                this.preview_files.push(new AddedWattsiFile(this.pr, this, this.wattsi, f));
            });
            this.wattsi.removedFiles.forEach(f => {
                this.unchanged_files.push(new RemovedWattsiFile(this.pr, this, this.wattsi, f));
            });
            this.wattsi.unchangedFiles.forEach(f => {
                this.unchanged_files.push(new UnchangedWattsiFile(this.pr, this, this.wattsi, f));
            });
        } else {
            this.preview_files = [this.pr.isMultipage ? new File(this.pr, this, this.src_file) : new File(this.pr, this)];
            this.unchanged_files = [];
        }
    }

    async cleanup() {
        if (this.wattsi) {
            await this.wattsi.cleanup();
        }
    }
}

module.exports = SpecBuild;