"use strict";

var ViewBase = require('./base');

class ViewError extends ViewBase {
    constructor() {
        super();
    }
    
    content(pr, err) {
        return `
${ this.title(err) }

${ this.lead(err, pr) }

${ this.summary(err, pr) }
`;
    }
    
    title(err) {
        return `### :boom: ${err.name}: ${err.message} :boom: ###`;
    }

    lead(err, pr) {
        let str = this.lastTried(new Date(), pr);
        return `[PR Preview](https://github.com/tobie/pr-preview#pr-preview) failed to build. ${ str }.`;
    }
    
    lastTried(date, pr) {
        let d = this.getDate(date);
        let sha = pr && pr.head && pr.head.short_sha;
        return `_(Last tried on ${d}` + (sha ? ` for ${sha})` : ")_");
    }
    
    link(err) {
        let url = err.data && err.data.request_url;
        return url ? `:link: [Related URL](${url})` : "";
    }
    
    stack(err) {
        let stack = err.data && err.data.error;
        return stack ? `\`\`\`
${stack}
\`\`\`` : "";
}

    summary(err, pr) {
        let link = this.link(err);
        let stack = this.stack(err);
        //if (!stack && !link) { return ""; }
        //if (!stack) { return link; }
        return `<details>
<summary>More</summary>

${ link }

${ stack }

_If the error is not surfaced properly, please [file an issue](${ this.issueUrl(pr) })._
</details>`;
    }
    
    issueUrl(pr) {
        var base = "https://github.com/tobie/pr-preview/issues/new";
        return `${base}?title=Error%20not%20surfaced%20properly&body=See%20${pr.owner}/${pr.repo}%23${pr.number}.`;
    }
}

module.exports = ViewError;