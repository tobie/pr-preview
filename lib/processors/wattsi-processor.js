"use strict";

const Processor = require('./processor');
const WattsiClient = require('../wattsi-client');
const File = require('../models/file');
const WattsiFile = File.WattsiFile;
const AddedWattsiFile = File.AddedWattsiFile;
const RemovedWattsiFile = File.RemovedWattsiFile;
const UnchangedWattsiFile = File.UnchangedWattsiFile;

class WattsiProcessor extends Processor {
    getServiceUrl() {
        return null;
    }

    getService() {
        return null;
    }

    getUrl(githubUrl, options) {
        return githubUrl + Processor.buildQuery(options, "?");
    }

    async processFiles(head) {
        // Wattsi processor handles file processing differently - it processes multiple files
        // and handles diffs between head and merge base
        const wattsiClient = new WattsiClient(head.pr);
        await wattsiClient.getFilenames();

        // Store wattsi client on PR for cleanup later
        head.pr.wattsi = wattsiClient;

        // Create file objects for Wattsi processing
        this.createWattsiFiles(head.pr, wattsiClient);

        return this.getUrl(head.github_url, head.urlOptions());
    }

    createWattsiFiles(pr, wattsiClient) {
        pr.preview_files = [];
        pr.unchanged_files = [];

        wattsiClient.modifiedFiles.forEach(f => {
            pr.preview_files.push(new WattsiFile(pr, wattsiClient, f));
        });
        wattsiClient.addedFiles.forEach(f => {
            pr.preview_files.push(new AddedWattsiFile(pr, wattsiClient, f));
        });
        wattsiClient.removedFiles.forEach(f => {
            pr.unchanged_files.push(new RemovedWattsiFile(pr, wattsiClient, f));
        });
        wattsiClient.unchangedFiles.forEach(f => {
            pr.unchanged_files.push(new UnchangedWattsiFile(pr, wattsiClient, f));
        });
    }

}

module.exports = WattsiProcessor;