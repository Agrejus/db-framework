"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexedDbPlugin = exports.validateAttachedEntity = void 0;
const idb_1 = require("idb");
const dataStoreName = "data";
const validateAttachedEntity = (entity) => {
    const properties = ["_id", "_timestamp", "DocumentType"];
    return properties.map(w => {
        const value = entity[w];
        const result = {
            ok: true,
            propertyName: w,
            error: "",
            entity
        };
        if (value == null) {
            result.ok = false;
            result.error = `Property cannot be null or undefined.  Property: ${String(w)}, Entity: ${JSON.stringify(entity)}`;
            return result;
        }
        return result;
    });
};
exports.validateAttachedEntity = validateAttachedEntity;
class IndexedDbPlugin {
    constructor(options) {
        this.idPropertyName = "_id";
        this.types = {
            exclusions: ""
        };
        this.options = options;
    }
    createDb() {
        return __awaiter(this, void 0, void 0, function* () {
            const idPropertyName = this.idPropertyName;
            return yield (0, idb_1.openDB)(this.options.dbName, 1, {
                upgrade(db, oldVersion, newVersion, transaction) {
                    db.createObjectStore(dataStoreName, {
                        keyPath: idPropertyName
                    });
                },
                blocked(currentVersion, blockedVersion, event) {
                    console.log(`Blocked: ${currentVersion}, Blocked Version: ${blockedVersion}, Event:`, event);
                },
                blocking(currentVersion, blockingVersion, event) {
                    console.log(`Blocking: ${currentVersion}, Blocking Version: ${blockingVersion}, Event:`, event);
                },
                terminated() {
                    console.log(`Terminated`);
                }
            });
        });
    }
    doWork(mode, action) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.createDb();
            const transaction = db.transaction(dataStoreName, mode);
            const result = yield action(transaction);
            yield transaction.done;
            db.close();
            return result;
        });
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            //return await this.doWork(w => w.destroy(), false);
        });
    }
    all(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.doWork('readonly', (w) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const docs = yield w.store.getAll();
                    debugger;
                    return docs;
                }
                catch (e) {
                    if ('message' in e && e.message.includes("database is closed")) {
                        throw e;
                    }
                    return Promise.resolve([]);
                }
            }));
            return result;
        });
    }
    query(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.all();
        });
    }
    getStrict(_, ...ids) {
        return __awaiter(this, void 0, void 0, function* () {
            if (ids.length === 0) {
                return [];
            }
            return yield this.doWork('readonly', w => w.store.getAll(ids));
            // return result.results.map(w => {
            //     const result = w.docs[0];
            //     if ('error' in result) {
            //         throw new Error(`docid: ${w.id}, error: ${JSON.stringify(result.error, null, 2)}`)
            //     }
            //     return result.ok as TEntityBase;
            // });
        });
    }
    get(_, ...ids) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getStrict(_, ...ids);
        });
    }
    // async putRecord(record: TEntityBase) {
    //     return await this.doWork(async w => {
    //         const result = await w.put(dataStoreName, record, record._id);
    //         w.close();
    //         return result;
    //     });
    // }
    bulkOperations(operations, _) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { adds, removes, updates } = operations;
                debugger;
                const response = yield this.doWork("readwrite", (w) => __awaiter(this, void 0, void 0, function* () {
                    debugger;
                    const addResult = yield Promise.all(adds.map(item => w.store.put(Object.assign(Object.assign({}, item), { _timestamp: Date.now() }))));
                    const updateResult = yield Promise.all(updates.map(item => w.store.put(item)));
                    const removeResult = yield Promise.all(removes.map(item => w.store.delete(item._id)));
                    debugger;
                }));
                return null;
            }
            catch (e) {
            }
        });
    }
    formatBulkDocsResponse(response) {
        const result = {
            errors: {},
            successes: {},
            errors_count: 0,
            successes_count: 0
        };
        for (const item of response) {
            if ('error' in item) {
                const error = item;
                if (!error.id) {
                    continue;
                }
                result.errors_count += 1;
                result.errors[error.id] = {
                    id: error.id,
                    ok: false,
                    error: error.message,
                    rev: error.rev
                };
                continue;
            }
            const success = item;
            result.successes_count += 1;
            result.successes[success.id] = {
                id: success.id,
                ok: success.ok,
                rev: success.rev
            };
        }
        return result;
    }
    prepareAttachments(...entities) {
        return __awaiter(this, void 0, void 0, function* () {
            const validationFailures = entities.map(w => (0, exports.validateAttachedEntity)(w)).flat().filter(w => w.ok === false);
            const result = {
                ok: true,
                docs: [],
                errors: []
            };
            if (validationFailures.length > 0) {
                result.errors = validationFailures.map(w => w.error);
                result.ok = false;
                return result;
            }
            const entityMap = entities.reduce((a, v) => {
                if (a[v.DocumentType] == null) {
                    a[v.DocumentType] = [];
                }
                a[v.DocumentType].push(v);
                return a;
            }, {});
            const foundAll = yield Promise.all(Object.keys(entityMap).map((w) => this.getStrict(w, ...entityMap[w].map(x => x._id))));
            const found = foundAll.reduce((a, v) => a.concat(v), []);
            const foundDictionary = found.reduce((a, v) => (Object.assign(Object.assign({}, a), { [v._id]: v._timestamp })), {});
            result.docs = entities.map(w => (Object.assign(Object.assign({}, w), { _timestamp: foundDictionary[w._id] })));
            return result;
        });
    }
    _isAdditionAllowed(entity) {
        const indexableEntity = entity;
        // cannot add an entity that already has a rev, means its in the database already
        if (!!indexableEntity["_timestamp"]) {
            return {
                ok: false,
                error: "Cannot add entity that is already in the database, please modify entites by reference or attach an existing entity"
            };
        }
        return { ok: true };
    }
    _isRemovalAllowed(entity) {
        const indexableEntity = entity;
        // cannot add an entity that already has a rev, means its in the database already
        if (!indexableEntity["_timestamp"]) {
            return {
                ok: false,
                error: "Cannot remove entity that is not in the database, please supply _timestamp property"
            };
        }
        return { ok: true };
    }
    isOperationAllowed(entity, operation) {
        const map = {
            "add": this._isAdditionAllowed,
            "remove": this._isRemovalAllowed
        };
        const cb = map[operation];
        if (cb == null) {
            return { ok: true };
        }
        return cb(entity);
    }
    prepareDetachments(...entities) {
        const validationFailures = entities.map(w => (0, exports.validateAttachedEntity)(w)).flat().filter(w => w.ok === false);
        const result = {
            ok: true,
            docs: [],
            errors: []
        };
        if (validationFailures.length > 0) {
            result.errors = validationFailures.map(w => w.error);
            result.ok = false;
            return result;
        }
        result.docs = entities;
        return result;
    }
    enrichGenerated(response, entity) {
        const found = response.successes[entity._id];
        if (found && found.ok === true) {
            return Object.assign(Object.assign({}, entity), { _timestamp: found.rev });
        }
        return entity;
    }
    enrichRemoval(entity) {
        return Object.assign({}, entity);
    }
}
exports.IndexedDbPlugin = IndexedDbPlugin;
//# sourceMappingURL=IndexedDbPlugin.js.map