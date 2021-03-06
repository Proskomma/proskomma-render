class ScriptureParaDocument {

    constructor(result, context, config) {
        this.queryResult = result;
        this.result = result;
        this.context = context;
        this.config = config;
        this.documentModels = {};
        this.classActions = {
            startDocument: [],
            endDocument: [],
            startSequence: [],
            endSequence: [],
            startBlock: [],
            endBlock: [],
            blockGraft: [],
            startItems: [],
            endItems: [],
            token: [],
            scope: [],
            inlineGraft: [],
            startStackRow: [],
            endStackRow: [],
        };
        this.delegatedActionKeys = new Set([]);
        this.allActions = {};
        this.docSetModel = null;
        this.key = null;
    }

    writeLogEntry(level, msg) {
        this.docSetModel.log.push({
            component: `docSet${this.key === 'default' ? '' : `:${this.key}`}`,
            level,
            msg,
        })
    }

    addAction(actionType, test, action, continueAfter) {
        continueAfter = !!continueAfter;
        if (actionType in this.classActions) {
            this.classActions[actionType].push({test, action, continueAfter});
        } else if (this.delegatedActionKeys.has(actionType)) {
            this.documentModels.default.addAction(actionType, test, action, continueAfter);
        } else {
            throw new Error(`Unknown action type '${actionType}' in document`);
        }
    }

    applyClassActions(classActions, data) {
        for (const classAction of classActions) {
            if (classAction.test(this.context, data)) {
                classAction.action(this, this.context, data);
                if (!classAction.continueAfter) {
                    break;
                }
            }
        }
    }

    render(document, config, renderSpec) {
        for (const action of Object.keys(this.classActions)) {
            this.allActions[action] = (renderSpec.actions[action] || []).concat(this.classActions[action]);
        }
        this.context.document = {
            id: document.id,
            idType: document.idParts.type,
            idParts: document.idParts.parts,
            headers: {},
            tags: document.tags
        };
        for (const header of document.headers) {
            this.context.document.headers[header.key] = header.value;
        }
        this.renderStartDocument(document);
        this.renderSequences(document.sequences, renderSpec);
        this.renderEndDocument(document);
        delete this.context.document;
    }

    renderSequences(sequences, renderSpec) {
        this.context.sequences = {};
        for (const sequence of sequences) {
            this.context.sequences[sequence.id] = sequence;
            if (sequence.type === "main") {
                this.context.mainSequence = sequence;
            }
        }
        this.context.sequenceStack = [];
        this.renderSequenceId(renderSpec.sequence || this.context.mainSequence.id);
        delete this.context.sequenceStack;
        delete this.context.mainSequence;
        delete this.context.sequences;
    }

    renderSequenceId(sequenceId) {
        const sequence = this.context.sequences[sequenceId];
        this.context.sequenceStack.unshift({
            id: sequence.id,
            type: sequence.type,
            openScopes: new Set([]),
            nBlocks: sequence.blocks.length,
            renderStack: [[]]
        });
        this.renderStartSequence(sequence);
        this.renderBlocks(sequence.blocks);
        this.renderEndSequence(sequence);
        this.context.sequenceStack.shift();
    }

    renderBlocks(blocks) {
        for (const [n, block] of blocks.entries()) {
            this.context.sequenceStack[0].block = {
                blockScope: block.bs.payload,
                nBlockGrafts: block.bg.length,
                nItems: block.items.length,
                blockPos: n
            };
            this.renderStartBlock(block);
            this.renderBlockGrafts(block.bg);
            this.renderStartItems(block.items);
            this.renderItems(block.items);
            this.renderEndItems(block.items);
            this.renderEndBlock(block);
            delete this.context.sequenceStack[0].block;
        }
    }

    renderBlockGrafts(blockGrafts) {
        for (const blockGraft of blockGrafts) {
            this.renderBlockGraft(blockGraft);
        }
    }

    renderItems(items) {
        for (const [n, item] of items.entries()) {
            this.context.sequenceStack[0].item = {
                itemPos: n
            };
            this.renderItem(item);
            delete this.context.sequenceStack[0].item;
        }
    }

    renderItem(item) {
        switch (item.type) {
            case "token":
                this.renderToken(item);
                break;
            case "scope":
                this.renderScope(item);
                break;
            case "graft":
                this.renderInlineGraft(item);
                break;
        }
    };

    renderStartDocument(document) {
        this.applyClassActions(this.allActions.startDocument, document);
    }

    renderEndDocument(document) {
        this.applyClassActions(this.allActions.endDocument, document);
    }

    renderStartSequence(sequence) {
        this.applyClassActions(this.allActions.startSequence, sequence);
    }

    renderEndSequence(sequence) {
        while (this.nStackRows() > 0) {
            this.popStackRow();
        }
        this.applyClassActions(this.allActions.endSequence, sequence);
    }

    renderStartBlock(block) {
        this.applyClassActions(this.allActions.startBlock, block);
    };

    renderEndBlock(block) {
        this.applyClassActions(this.allActions.endBlock, block);
    };

    renderBlockGraft(blockGraft) {
        this.context.sequenceStack[0].blockGraft = {
            subType: blockGraft.subType
        };
        this.applyClassActions(this.allActions.blockGraft, blockGraft);
        delete this.context.sequenceStack[0].blockGraft;
    };

    renderStartItems(items) {
        this.applyClassActions(this.allActions.startItems, items);
    };

    renderEndItems(items) {
        this.applyClassActions(this.allActions.endItems, items);
    };

    renderToken(token) {
        this.applyClassActions(this.allActions.token, token);
    };

    renderScope(scope) {
        if (scope.subType === "start") {
            this.context.sequenceStack[0].openScopes.add(scope.payload);
        }
        this.applyClassActions(this.allActions.scope, scope);
        if (scope.subType === "end") {
            this.context.sequenceStack[0].openScopes.delete(scope.payload);
        }
    };

    renderInlineGraft(graft) {
        this.context.sequenceStack[0].inlineGraft = {
            subType: graft.subType
        };
        this.applyClassActions(this.allActions.inlineGraft, graft);
        delete this.context.sequenceStack[0].inlineGraft;
    };

    appendToTopStackRow(item) {
        this.context.sequenceStack[0].renderStack[0].push(item);
    }

    nStackRows() {
        return this.context.sequenceStack[0].renderStack.length;
    }

    topStackRow() {
        return this.context.sequenceStack[0].renderStack[0];
    }

    pushStackRow() {
        this.applyClassActions(this.allActions.startStackRow, this.topStackRow);
        this.context.sequenceStack[0].renderStack.unshift([]);
    }

    popStackRow() {
        this.applyClassActions(this.allActions.endStackRow, this.topStackRow);
        return this.context.sequenceStack[0].renderStack.shift();
    }

}

module.exports = ScriptureParaDocument;
