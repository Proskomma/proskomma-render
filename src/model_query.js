const doModelQuery = async (pk, docSetIds, documentIds) => {
    // Empty arrays mean all docSets/documents
    docSetIds = docSetIds || [];
    documentIds = documentIds || [];
    const result = await pk.gqlQuery(
        '{' +
        `  docSets${docSetIds.length === 0 ? '' : `(ids:[${docSetIds.map(ds => `"${ds}"`).join(', ')}])`} {` +
        '    id' +
        '    selectors { key value }' +
        '    tags' +
        `    documents${documentIds.length === 0 ? '(' : `(ids:[${documentIds.map(d => `"${d}"`).join(', ')}] `}sortedBy: "paratext") {` +
        '      id' +
        '      headers { key value }' +
        '      idParts { type parts }' +
        '      tags' +
        '      sequences {' +
        '        id' +
        '        type' +
//        '        tags' +
        '        blocks {' +
        '          bs { payload }' +
        '          bg { subType payload }' +
        '          items { type subType payload }' +
        '        }' +
        '      }' +
        '    }' +
        '  }' +
        '}'
    );
    if (result.errors) {
        throw new Error(result.errors);
    }
    return result.data;
}

module.exports = doModelQuery;
