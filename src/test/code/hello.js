const test = require('tape');

const {
    ScriptureParaModel,
    ScriptureDocSet,
    ScriptureParaDocument,
    ScriptureParaModelQuery
} = require('../../../');

const { pkWithDocs } = require('../lib/load');
const pk = pkWithDocs(
    [
        ['../test_data/rut.usfm', {lang: "eng", abbr: "webbe"}],
        ['../test_data/est.usfm', {lang: "eng", abbr: "webbe"}],
        ['../test_data/rut.usfm', {lang: "eng", abbr: "webbe2"}],
    ],
    {}
);
let globalResult;

const testGroup = "Basics";

test(
    `Instantiation (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            t.doesNotThrow(() => new ScriptureParaModel);
            t.doesNotThrow(() => new ScriptureDocSet);
            t.doesNotThrow(() => new ScriptureParaDocument);
        } catch (err) {
            console.log(err);
        }
    },
);

test(
    `ScriptureParaModelQuery with one arg (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            globalResult = await ScriptureParaModelQuery(pk);
            t.equal(globalResult.docSets.length, 2);
            t.equal(globalResult.docSets[0].documents.length, 2);
            t.equal(globalResult.docSets[1].documents.length, 1);
        } catch (err) {
            console.log(err);
        }
    },
);

test(
    `ScriptureParaModelQuery with two args (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const resultData = await ScriptureParaModelQuery(pk, ['eng_webbe']);
            t.equal(resultData.docSets.length, 1);
            t.equal(resultData.docSets[0].documents.length, 2);
        } catch (err) {
            console.log(err);
        }
    },
);

test(
    `ScriptureParaModelQuery with three args (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const docId = globalResult.docSets[0].documents[0].id;
            const resultData = await ScriptureParaModelQuery(pk, ['eng_webbe'], [docId]);
            t.equal(resultData.docSets.length, 1);
            t.equal(resultData.docSets[0].documents.length, 1);
            // console.log(JSON.stringify(resultData, null, 2));
        } catch (err) {
            console.log(err);
        }
    },
);
