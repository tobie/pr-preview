const realFetchUrl = require("./fetch-url");
const GITHUB_SERVICE = require("./services").GITHUB;

/** Resolves path relative to scopeUrl, with the restriction that path can't use
 * any components that might go "above" the base URL.
 *
 * @param {string} scopeUrl
 * @param {string} path
 *
 * @returns {string|undefined} `undefined` if either URL can't be parsed, or if
 * the path navigated "up" in any way.
 */
function resolveSubUrl(scopeUrl, path) {
    if (!scopeUrl.endsWith('/')) {
        throw new Error(`${JSON.stringify(scopeUrl)} isn't a good scope URL.`)
    }
    if (path.startsWith('/') ||
        path.includes('../') ||
        // Block schemes, a bit more aggressively than necessary.
        path.includes(':')) {
        return undefined;
    }

    let resolvedUrl;
    try {
        resolvedUrl = new URL(path, scopeUrl).href;
    } catch {
        return undefined;
    }
    if (!resolvedUrl.startsWith(scopeUrl)) {
        throw new Error(`Path restrictions in resolveSubUrl(${JSON.stringify(scopeUrl)}, ${JSON.stringify(path)}) failed to catch an upward navigation.`);
    }
    return resolvedUrl;

}

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
module.exports = async function scanIncludes(repositoryUrl, rootSpec, specType, fetchUrl = realFetchUrl) {
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

    /** All the paths that successfully fetched go here. This is the result of
     * the overall scan. */
    const recursiveIncludes = new Set();
    /** All the files we ever fetched, for the purpose of short-circuiting. */
    const everFetched = new Set();

    /** Fetches path relative to repositoryUrl, adds it to recursiveIncludes if
     * the fetch worked, and then recursively scans any includes found in the
     * response.
     */
    async function scanOneFile(path) {
        if (everFetched.has(path)) return;
        everFetched.add(path);

        const resolvedUrl = resolveSubUrl(repositoryUrl, path);
        if (resolvedUrl === undefined) return;

        let body;
        try {
            body = await fetchUrl(resolvedUrl, GITHUB_SERVICE);
        } catch {
            // This include scan can have false positives, so if one
            // fails to fetch, we assume it's not a real include and
            // just ignore the fetch failure.
            return;
        }
        recursiveIncludes.add(path);
        const subScans = [];
        for (const match of body.matchAll(includeRE)) {
            for (let i = 1; i < match.length; i++) {
                if (match[i]) {
                    subScans.push(scanOneFile(match[i].trim()));
                }
            }
        }
        await Promise.all(subScans);
    }
    await scanOneFile(rootSpec);

    return recursiveIncludes;
}
