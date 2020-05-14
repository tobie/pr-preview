const realFetchUrl = require("./fetch-url");
const GITHUB_SERVICE = require("./services").GITHUB;


/** Scans for recursively included paths from a root specification.
 *
 * @param {string} repositoryUrl The base URL of the repository. The function
 * won't fetch anything outside of this scope. This must end with a `/`.
 * @param {string} rootSpec A path relative to the `repositoryUrl` pointing to
 * the root specification in the `specType` format.
 * @param {"bikeshed"|"respec"} specType
 *
 * @returns {Promise<Set<string>>} Paths relative to `repositoryUrl` that are
 * recursively included by the specification.
 */
module.exports = async function scanIncludes(repositoryUrl, rootUrl, specType, fetchUrl = realFetchUrl) {
    if (!repositoryUrl.endsWith('/')) {
        throw new Error(`${repositoryUrl} must end with a '/'.`);
    }
    let includeRE;
    switch (specType) {
        case "bikeshed":
            includeRE = /^path:([^\n]+)$/gm;
            break;
        case "respec":
            includeRE = /data-include="([^"]+)"|data-include='([^']+)'/g;
            break;
        default:
            throw new Error(`Unexpected specification type: ${JSON.stringify(specType)}`);
    }

    /** All the files that successfully fetched go here. */
    const recursiveIncludes = new Set();
    /** When this gets back to empty, we're done searching includes. */
    const inProgressFetches = new Set();

    await new Promise((resolve, reject) => {
        async function scanOneFile(path) {
            try {
                console.log("Scanning", path);
                if (path.startsWith('/') ||
                    path.includes('../') ||
                    // Block schemes, a bit more aggressively than necessary.
                    path.includes(':')) {
                    return;
                }
                let resolvedUrl;
                try {
                    resolvedUrl = new URL(path, repositoryUrl).href;
                    if (!resolvedUrl.startsWith(repositoryUrl)) {
                        console.error(resolvedUrl, "doesn't start with", repositoryUrl);
                        // Can't include paths outside the repository.
                        return;
                    }
                } catch (e) {
                    console.error(e);
                    // Don't treat broken URLs as includes.
                    return;
                }

                inProgressFetches.add(path);
                recursiveIncludes.add(path);
                try {
                    console.log("Fetching", resolvedUrl);
                    body = await fetchUrl(resolvedUrl, GITHUB_SERVICE);
                    console.log("Got", resolvedUrl);
                    for (const match of body.matchAll(includeRE)) {
                        for (let i = 1; i < match.length; i++) {
                            const included = match[i].trim();
                            if (included) {
                                console.log("Found include:", included);
                                scanOneFile(included).catch(reject);
                            }
                        }
                    }
                } catch (err) {
                    console.error(resolvedUrl, "failed with", err);
                    // This include scan can have false positives, so if one fails to fetch,
                    // we assume it's not a real include.
                    recursiveIncludes.delete(path);
                }
            } finally {
                inProgressFetches.delete(path);
                if (inProgressFetches.size == 0) {
                    resolve();
                }
            }
        }

        scanOneFile(rootUrl).catch(reject);
    });

    return recursiveIncludes;
}

/** If `nestedUrl` is under `baseUrl`, returns the relative URL such that `new
 * URL(relative, baseUrl)` returns `nestedUrl`.
 *
 * Otherwise throws an Error.
 *
 * @param {string} baseUrl
 * @param {string} nestedUrl
 */
function enforceRelative(baseUrl, nestedUrl) {
    if (relativeUrl.startsWith(baseUrl)) {
        return nestedUrl.substr(baseUrl.length);
    } else {
        throw new Error(`${JSON.stringify(nestedUrl)} is not inside ${JSON.stringify(baseUrl)}.`);
    }
}
