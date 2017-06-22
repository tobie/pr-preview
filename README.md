# PR Preview

Adds preview and diff links to pull requests.

![screenshot](/images/screenshot-1.jpg)

## Assumptions

The only assumption made by PR Preview is that you're using either Bikeshed or ReSpec to edit your spec.

## Install

This is [available as a GitHub App](https://github.com/apps/pr-preview).

Once the integration is installed,
you **must** add a configuration file to the root of your repository.
Nothing will happen until you do.

Note that the following orgs have blanket install of pr-preview,
which means that [adding a config file](https://tobie.github.io/pr-preview/config.html)
is all you need to be setup if your repository is hosted in one of them:

* [github.com/w3c](https://github.com/w3c/)
* [github.com/whatwg](https://github.com/whatwg/)
* [github.com/wicg](https://github.com/wicg/)

## Configuration file

_To test your own config file and turn it into a pull request,
go to the [config page](https://tobie.github.io/pr-preview/config.html)._

You must configure PR Preview by adding a
`.pr-preview.json` json file at the root of your repository
with the following fields:

```json
{
    "src_file": "index.bs",
    "type": "bikeshed",
    "params": {
        "md-foo": "bar"
    }
}
```

### `src_file` (required)

This should point to the relative path to the source file from the root of the repository.

### `type` (required)

One of "bikeshed" or "respec".

### `params` (optional)

`params` are used to construct the URL that transform the source file into an html document
using either:

* [Bikeshed's web service](https://api.csswg.org/bikeshed/), or
* [W3C's ReSpec web service](https://github.com/w3c/spec-generator).

When constructing the URL, `params` are rendered as if they were [mustache template strings](https://github.com/janl/mustache.js#mustachejs---logic-less-mustache-templates-with-javascript).

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
    "type": "bikeshed",
    "params": {
        "force": 1,
        "md-status": "LS-COMMIT",
        "md-h1": "URL <small>(<a href=\"{{ pull_request.html_url }}\">PR #{{ pull_request.number }}</a>)</small>",
        "md-warning": "Commit {{ short_sha }} {{ pull_request.head.repo.html_url }}/commit/{{ sha }} replaced by {{ config.ls_url }}",
        "md-title": "{{ config.title }} (Pull Request Snapshot #{{ pull_request.number }})",
        "md-Text-Macro": "SNAPSHOT-LINK {{ config.back_to_ls_link }}"
    },
    "ls_url": "https://url.spec.whatwg.org/",
    "title": "URL Standard",
    "back_to_ls_link": "<a href=\"https://url.spec.whatwg.org/\" id=\"commit-snapshot-link\">Go to the living standard</a>"
}
```

