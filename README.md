# webidl-pr-preview
Adds preview and diff links to pull requests.

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

webidl-pr-preview uses the following defaults:

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
and the `owner`, `repo`, `branch`, `sha` and `short_sha` of the branch being rendered:

```js
{
    config: { /* ... */ },       // The config object defined above.
    pull_request: { /* ... */ }, // The pull request payload.
    owner: "heycam",             // owner's login
    repo: "webidl",              // repo's name
    branch: "gh-pages",          // branch name
    sha: "7dfd134ee2e6df7fe0..." // duh
    short_sha: "7dfd134"         // sha truncated to 7 characters
}
```

