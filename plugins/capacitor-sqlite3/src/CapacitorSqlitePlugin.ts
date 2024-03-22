import type { IDbPlugin, IDbPluginOptions, IBulkOperationsResponse, IQueryParams, DbPluginOperations, Transactions } from '@agrejus/db-framework';
import { validateAttachedEntity } from './validator';
import { v4 as uuidv4 } from 'uuid';
import { CapacitorSqlite, CapacitorSqliteRecord } from '.';

export class CapacitorSqlitePlugin<TDocumentType extends string, TEntityBase extends CapacitorSqliteRecord<TDocumentType>, TDbPluginOptions extends IDbPluginOptions = IDbPluginOptions> implements IDbPlugin<TDocumentType, TEntityBase, "_id" | "_rev"> {

    protected readonly options: TDbPluginOptions;
    readonly idPropertyName = "_id";

    readonly types = {
        exclusions: "" as "_id" | "_rev"
    }

    constructor(options: TDbPluginOptions) {
        this.options = options;
    }

    async destroy() {
        return await CapacitorSqlite.destroy();
    }

    async all(payload?: IQueryParams<TDocumentType>) {
        return await CapacitorSqlite.all<TDocumentType, TEntityBase>(payload);
    }


    async getStrict(documentType: TDocumentType, ...ids: string[]) {

        const result = await this.get(documentType, ...ids)

        return result as TEntityBase[];
    }

    async get(_: TDocumentType, ...ids: string[]) {
        if (ids.length === 0) {
            return [];
        }

        const result = await CapacitorSqlite.get(...ids);

        return result as TEntityBase[];
    }

    async bulkOperations(operations: { adds: TEntityBase[]; removes: TEntityBase[]; updates: TEntityBase[]; }, _: Transactions) {
        return await CapacitorSqlite.bulkDocs({
            adds: operations.adds.map(w => ({ ...w, _rev: `1-${uuidv4()}` })),
            removes: operations.removes.map(w => ({ ...w })),
            updates: operations.updates.map(w => ({ ...w }))
        })
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

        const groups = entities.reduce((a, v) => ({ ...a, [v.DocumentType]: [...(a[v.DocumentType] || []), v] }), {} as { [key: string]: TEntityBase[] });

        for (const group in groups) {
            const foundEntities = groups[group as TDocumentType];
            const found = await this.getStrict(group as TDocumentType, ...foundEntities.map(w => w._id));
            const foundDictionary = found.reduce((a, v) => ({ ...a, [v._id]: v._rev }), {} as { [key: string]: any });
            result.docs.push(...entities.map(w => ({ ...w, _rev: foundDictionary[w._id] } as TEntityBase)));
        }

        return result;
    }

    private _isAdditionAllowed(entity: TEntityBase) {
        const indexableEntity = entity as any;

        // cannot add an entity that already has a rev, means its in the database already
        if (!!indexableEntity["_rev"]) {
            return {
                ok: false,
                error: "Cannot add entity that is already in the database, please modify entites by reference or attach an existing entity"
            }
        }

        return { ok: true };
    }

    private _isRemovalAllowed(entity: TEntityBase) {
        const indexableEntity = entity as any;

        // cannot add an entity that already has a rev, means its in the database already
        if (!indexableEntity["_rev"]) {
            return {
                ok: false,
                error: "Cannot remove entity that is not in the database, please supply _rev property"
            }
        }

        return { ok: true };
    }

    formatDeletions(...entities: TEntityBase[]): TEntityBase[] {
        return entities.map(w => {

            let result = { ...w, _id: w._id, _rev: w._rev, DocumentType: w.DocumentType, _deleted: true } as any;

            return result as TEntityBase
        })
    }

    isOperationAllowed(entity: TEntityBase, operation: DbPluginOperations) {

        if (operation === "add") {
            return this._isAdditionAllowed(entity)
        }

        if (operation === "remove") {
            return this._isRemovalAllowed(entity)
        }

        return {
            ok: true
        }
    }

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

    enrichGenerated(response: IBulkOperationsResponse, entity: TEntityBase) {

        const found = response.successes[entity._id];

        if (found && found.ok === true) {
            return { ...entity, _rev: found.rev }
        }

        return entity;
    }

    enrichRemoval(entity: TEntityBase) {
        return { ...entity }
    }
}