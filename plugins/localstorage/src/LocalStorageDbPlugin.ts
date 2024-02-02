import { IDbPlugin, IDbPluginOptions, IBulkOperationsResponse, IQueryParams, IDbRecordBase } from '@agrejus/db-framework';
import { MemoryDbRecord } from './types';
import { validateAttachedEntity } from './validator';
import { v4 as uuidv4 } from 'uuid';

declare var window: {
    localStorage: {
        clear: () => void,
        setItem: (key: string, value: string) => void;
        getItem: <T extends any>(key: string) => T;
        removeItem: (key: string) => void;
    }
};

export class LocalStorageDbPlugin<TDocumentType extends string, TEntityBase extends MemoryDbRecord<TDocumentType>, TDbPluginOptions extends IDbPluginOptions = IDbPluginOptions> implements IDbPlugin<TDocumentType, TEntityBase> {

    protected readonly options: TDbPluginOptions;
    idPropertName: keyof TEntityBase = "id";

    constructor(options: TDbPluginOptions) {
        this.options = options;
    }

    types: { exclusions: never; };

    prepareDetachments(...entities: TEntityBase[]): { ok: boolean; errors: string[]; docs: TEntityBase[]; } {
        const validationFailures = entities.map(w => validateAttachedEntity<TDocumentType, TEntityBase>(w)).flat().filter(w => w.ok === false);
        const result: { ok: boolean, docs: TEntityBase[], errors: string[] } = {
            ok: true,
            docs: [],
            errors: []
        }

        if (validationFailures.length > 0) {
            result.errors = validationFailures.map(w => w.error);
            result.ok = false;
            return result;
        }

        result.docs = entities;
        return result;
    }

    async prepareAttachments(...entities: TEntityBase[]) {
        const validationFailures = entities.map(w => validateAttachedEntity<TDocumentType, TEntityBase>(w)).flat().filter(w => w.ok === false);
        const result: { ok: boolean, docs: TEntityBase[], errors: string[] } = {
            ok: true,
            docs: [],
            errors: []
        }

        if (validationFailures.length > 0) {
            result.errors = validationFailures.map(w => w.error);
            result.ok = false;
            return result;
        }

        const found = await this.getStrict(...entities.map(w => w.id));
        const foundDictionary = found.reduce((a, v) => ({ ...a, [v.id]: v.rev }), {} as { [key: string]: any });
        result.docs = entities.map(w => ({ ...w, _rev: foundDictionary[w.id] } as TEntityBase));

        return result;
    }

    private _isAdditionAllowed(entity: TEntityBase) {
        const indexableEntity = entity as any;

        // cannot add an entity that already has a rev, means its in the database already
        if (!!indexableEntity["rev"]) {
            return false
        }

        return true;
    }

    isOperationAllowed(entity: TEntityBase, operation: 'add') {
        if (operation === "add") {
            return this._isAdditionAllowed(entity);
        }

        return false
    }

    formatDeletions(...entities: TEntityBase[]) {
        return entities;
    }

    setDbGeneratedValues(response: IBulkOperationsResponse, entities: TEntityBase[]) {
        // no op
    }

    async destroy() {
        window.localStorage.clear();
    }

    async all(payload?: IQueryParams<TDocumentType>) {
        const data = Object.keys(window.localStorage).map(w => window.localStorage.getItem<TEntityBase>(w));

        if (payload != null) {
            return data.filter(w => w.DocumentType === payload.DocumentType);
        }

        return data;
    }

    private _createRev(previousRev?: string) {
        const nextId = uuidv4();

        if (previousRev) {
            let count = Number(previousRev.substring(0, 1));
            return `${++count}-${nextId}`;
        }

        return `1-${nextId}`;
    }

    async getStrict(...ids: string[]) {

        return ids.reduce((a, v) => {

            const document = window.localStorage.getItem<TEntityBase>(v);
            if (document == null) {
                throw new Error(`Document not found for id.  ID: ${v}`)
            }

            return [...a, document] as TEntityBase[]

        }, [] as TEntityBase[])
    }

    async get(...ids: string[]) {
        return ids.reduce((a, v) => {

            const document = window.localStorage.getItem<TEntityBase>(v);
            if (document == null) {
                return a;
            }

            return [...a, document] as TEntityBase[]

        }, [] as TEntityBase[])
    }

    async bulkOperations(operations: { adds: TEntityBase[]; removes: TEntityBase[]; updates: TEntityBase[]; }) {
        const { adds, removes, updates } = operations;
        const result: IBulkOperationsResponse = {
            errors: {},
            errors_count: 0,
            successes: {},
            successes_count: 0
        }

        for (const add of adds) {

            const id = add[this.idPropertName] as string;

            try {
                memoryStore[id] = add;

                result.successes_count++;
                result.successes[id] = {
                    id,
                    ok: true,
                    rev: this._createRev()
                }
            } catch (e: any) {
                result.errors_count++;
                result.errors[id] = {
                    id,
                    ok: false,
                    rev: "",
                    error: e
                }
            }
        }

        for (const remove of removes) {

            const id = remove[this.idPropertName] as string;

            try {
                delete memoryStore[id];

                result.successes_count++;
                result.successes[id] = {
                    id,
                    ok: true,
                    rev: ""
                }
            } catch (e: any) {
                result.errors_count++;
                result.errors[id] = {
                    id,
                    ok: false,
                    rev: "",
                    error: e
                }
            }
        }

        for (const update of updates) {
            const id = update[this.idPropertName] as string;

            try {
                memoryStore[id] = update;

                result.successes_count++;
                result.successes[id] = {
                    id,
                    ok: true,
                    rev: this._createRev(update.rev)
                }
            } catch (e: any) {
                result.errors_count++;
                result.errors[id] = {
                    id,
                    ok: false,
                    rev: "",
                    error: e
                }
            }
        }

        return result;
    }
}