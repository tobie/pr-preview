# webidl-pr-preview
Adds preview and diff to spec pull requests.

## Assumptions

Currently, webidl-pr-preview makes the following assumptions about the structure of your repository:

* You are using Bikeshed to build your spec and PRs contain the rendered bs file at `index.html`.

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

* **ed_url**: `https://[OWNER_NAME].github.io/[REPO_NAME]/`
* **src_file**: `index.bs`
* **bikeshed_parameters**: `{ }`

