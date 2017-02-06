# webidl-pr-preview
Adds preview and diff to spec pull requests.

## Assumptions

Currently, webidl-pr-preview makes the following assumptions about the structure of your repository:

* Your ED draft is the `index.html` hosted by GitHub pages at: https://[OWNER_NAME].github.io/[REPO_NAME]/.
* Your ED src file is hosted at the root of your directory in a file named `index.bs`.
* You are using Bikeshed to build your spec and PRs contain the rendered bs file at `index.html`.
