# webidl-pr-preview
Adds preview and diff links to pull requests.

## Install

This is [available as a GH integration](https://github.com/integration/pr-previewer-for-bikeshed-specs).

## Assumptions

Th eonly assumption made by webidl-pr-preview is that you're using Bikeshed to edit your spec.

## Configuration

You can configure webidl-pr-preview by adding a
`.pr-preview.json` json file at the root of your repository
with the following fields:

```json
{
    "ed_url": "https://heycam.github.io/webidl/",
    "src_file": "index.bs",
    "bikeshed_parameters": {
        "md-foo": "bar"
    }
}
```

All fields are otional and webidl-pr-preview uses the following defaults:

```json
{
    "ed_url": "https://[OWNER_LOGIN].github.io/[REPO_NAME]/",
    "src_file": "index.bs",
     "bikeshed_parameters": { }
}
```

### Bikeshed params

`bikeshed_parameters` are used to construct the URL that transform the source file into an html document
using [Bikeshed's web service](https://api.csswg.org/bikeshed/).

When constructing the URL, `bikeshed_parameters` are rendered as if they were [mustache template strings](https://github.com/janl/mustache.js#mustachejs---logic-less-mustache-templates-with-javascript).

They're passed an object containing the `config` object itself,
the [`pull_request` payload](https://developer.github.com/v3/pulls/#get-a-single-pull-request)
and the `owner`, `repo`, `branch`, `sha`, `short_sha` and `url` of the branch being rendered:

```js
{
    config: { /* ... */ },       // The config object defined above.
    pull_request: { /* ... */ }, // The pull request payload.
    owner: "heycam",             // owner's login
    repo: "webidl",              // repo's name
    branch: "gh-pages",          // branch name
    sha: "7dfd134ee2e6df7fe...", // duh
    short_sha: "7dfd134",        // sha truncated to 7 characters
    url: "https://s3.amazon..."  // URL where the spec will be hosted
}
```

Here's a fairly involved config file example the URL standard could use
to produce [this snapshot](https://api.csswg.org/bikeshed/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fwatilde%2Furl%2Fb46bf404569eece5597067e89749620faf0ea320%2Furl.bs&force=1&md-status=LS-COMMIT&md-h1=URL%20%3Csmall%3E(%3Ca%20href%3D%22https%3A%2F%2Fgithub.com%2Fwhatwg%2Furl%2Fpull%2F234%22%3EPR%20%23234%3C%2Fa%3E)%3C%2Fsmall%3E&md-warning=Commit%20b46bf40%20https%3A%2F%2Fgithub.com%2Fwatilde%2Furl%2Fcommit%2Fb46bf404569eece5597067e89749620faf0ea320%20replaced%20by%20https%3A%2F%2Furl.spec.whatwg.org%2F&md-title=URL%20Standard%20(Pull%20Request%20Snapshot%20%23234)&md-Text-Macro=SNAPSHOT-LINK%20%3Ca%20href%3D%22https%3A%2F%2Furl.spec.whatwg.org%2F%22%20id%3D%22commit-snapshot-link%22%3EGo%20to%20the%20living%20standard%3C%2Fa%3E):

```json
{
    "src_file": "url.bs",
    "ls_url": "https://url.spec.whatwg.org/",
    "title": "URL Standard",
    "back_to_ls_link": "<a href=\"https://url.spec.whatwg.org/\" id=\"commit-snapshot-link\">Go to the living standard</a>",
    "bikeshed_parameters": {
        "force": 1,
        "md-status": "LS-COMMIT",
        "md-h1": "URL <small>(<a href=\"{{ pull_request.html_url }}\">PR #{{ pull_request.number }}</a>)</small>",
        "md-warning": "Commit {{ short_sha }} {{ pull_request.head.repo.html_url }}/commit/{{ sha }} replaced by {{ config.ls_url }}",
        "md-title": "{{ config.title }} (Pull Request Snapshot #{{ pull_request.number }})",
        "md-Text-Macro": "SNAPSHOT-LINK {{ config.back_to_ls_link }}"
    }
}
```

