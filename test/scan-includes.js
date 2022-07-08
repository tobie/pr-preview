const assert = require('assert');
const scanIncludes = require('../lib/scan-includes');
const GITHUB_SERVICE = require("../lib/services").GITHUB;

function fakeFetch(results) {
    return async function fetch(url, service) {
        assert.equal(service, GITHUB_SERVICE);
        await new Promise(resolve => setImmediate(resolve));
        const result = results[url];
        assert(result);
        if (result.body !== undefined) {
            return result.body;
        }
        throw new Error(result.error);
    }
}

suite('scanIncludes', function () {
    test('No includes', async function () {
        assert.deepStrictEqual(await scanIncludes("https://github.example/repo/", "spec.bs", "bikeshed", fakeFetch({
            "https://github.example/repo/spec.bs": { body: "bikeshed stuff" },
        })),
            []);
    });
    test('None succeed', async function () {
        assert.deepStrictEqual(await scanIncludes("https://github.example/repo/", "spec.bs", "bikeshed", fakeFetch({
            "https://github.example/repo/spec.bs": { error: "" },
        })),
            []);
    });
    test('3 levels', async function () {
        assert.deepStrictEqual(await scanIncludes("https://github.example/repo/", "spec.bs", "bikeshed", fakeFetch({
            "https://github.example/repo/spec.bs": { body: "path: helper.inc" },
            "https://github.example/repo/helper.inc": { body: "path: helper2.inc\njunk\npath: doesntexist.inc" },
            "https://github.example/repo/helper2.inc": { body: "path: helper3.inc " },
            "https://github.example/repo/helper3.inc": { body: "" },
            "https://github.example/repo/doesntexist.inc": { error: "404" },
        })),
            [
                "helper.inc",
                "helper2.inc",
                "helper3.inc",
            ]);
    });
    test('Outside repository', async function () {
        assert.deepStrictEqual(await scanIncludes("https://github.example/repo/", "spec.bs", "bikeshed", fakeFetch({
            "https://github.example/repo/spec.bs": { body: "path: ../helper.inc\npath: //otherserver.example/helper2.inc\nhttps://yet.another.server.example/helper3.inc" },
            "https://github.example/helper.inc": { body: "path: https://github.example/repo/poison.inc" },
            "https://otherserver.example/helper2.inc": { body: "path: https://github.example/repo/poison.inc" },
            "https://yet.another.server.example/helper3.inc": { body: "path: https://github.example/repo/poison.inc" },
            "https://github.example/repo/poison.inc": { body: "Shouldn't fetch this." },
        })),
            []);
    });
    test('Bad URL bits inside repository', async function () {
        assert.deepStrictEqual(await scanIncludes("https://github.example/repo/", "spec.bs", "bikeshed", fakeFetch({
            "https://github.example/repo/spec.bs": { body: "path: ../repo/poison.inc\npath: /repo/poison.inc\npath: //github.example/repo/poison.inc\npath: https://github.example/repo/poison.inc" },
            "https://github.example/repo/poison.inc": { body: "" },
        })),
            []);
    });
    test('include loop should terminate', async function () {
        assert.deepStrictEqual(await scanIncludes("https://github.example/repo/", "spec.bs", "bikeshed", fakeFetch({
            "https://github.example/repo/spec.bs": { body: "path: loop.inc" },
            "https://github.example/repo/loop.inc": { body: "path: spec.bs" },
        })),
            ["loop.inc"]);
    });
    test('respec-style includes', async function () {
        assert.deepStrictEqual(await scanIncludes("https://github.example/repo/", "index.html", "respec", fakeFetch({
            "https://github.example/repo/index.html": {
                body: `
            <section id="element-foo"
                     data-include='single.html'>
            </section>
            <section id="element-foo"
                     data-include="double.html">
            </section>` },
            "https://github.example/repo/single.html": { body: "" },
            "https://github.example/repo/double.html": { body: "" },
        })),
            [
                "double.html",
                "single.html",
            ]);
    });
});
