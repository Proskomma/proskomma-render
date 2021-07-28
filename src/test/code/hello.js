const test = require('tape');

const {
    ScriptureParaModel,
    ScriptureDocSet,
    ScriptureParaDocument,
    ScriptureParaModelQuery
} = require('../../../');

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
