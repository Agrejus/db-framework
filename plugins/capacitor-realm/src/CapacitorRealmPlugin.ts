import type { IDbPlugin, IDbPluginOptions, IBulkOperationsResponse, IQueryParams } from '@agrejus/db-framework';
import { validateAttachedEntity } from './validator';
import { v4 as uuidv4 } from 'uuid';
import { CapacitorRealm, CapacitorRealmRecord, IRealmUser } from '.';

export class CapacitorRealmPlugin<TDocumentType extends string, TEntityBase extends CapacitorRealmRecord<TDocumentType>, TDbPluginOptions extends IDbPluginOptions = IDbPluginOptions> implements IDbPlugin<TDocumentType, TEntityBase, "_id" | "_rev"> {

    protected readonly options: TDbPluginOptions;
    readonly idPropertName = "_id";
    private _getUser: () => Promise<IRealmUser | null> = async () => null;

    readonly types = {
        exclusions: "" as "_id" | "_rev"
    }

    constructor(options: TDbPluginOptions) {
        this.options = options;
    }

    registerGetUserCallback(callback: () => Promise<IRealmUser | null>) {
        this._getUser = callback;
    }

    async destroy() {
        const user = await this._getUser();
        return await CapacitorRealm.destroy(user);
    }

    async all(payload?: IQueryParams<TDocumentType>) {
        const user = await this._getUser();
        return await CapacitorRealm.all<TDocumentType, TEntityBase>({
            payload,
            user
        });
    }

    async getStrict(documentType: TDocumentType, ...ids: string[]) {

        const result = await this.get(documentType, ...ids)

        if (result.length !== ids.length) {
            throw new Error('Could not find document')
        }

        return result as TEntityBase[];
    }

    async get(documentType: TDocumentType, ...ids: string[]) {
        if (ids.length === 0) {
            return [];
        }

        const user = await this._getUser();
        const result = await CapacitorRealm.get(documentType, ids, user);

        return result as TEntityBase[];
    }

    async bulkOperations(operations: { adds: TEntityBase[]; removes: TEntityBase[]; updates: TEntityBase[]; }) {
        const user = await this._getUser();
        return await CapacitorRealm.bulkDocs(
            {
                adds: operations.adds.map(w => ({ ...w, _rev: `1-${uuidv4()}` })),
                removes: operations.removes.map(w => ({ ...w })),
                updates: operations.updates.map(w => ({ ...w }))
            },
            user)
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

        const groupedByDocumentType = entities.reduce((a, v) => {

            if (a[v.DocumentType] == null) {
                a[v.DocumentType] = [];
            }

            a[v.DocumentType].push(v._id)
            return a;
        }, {} as { [key: string]: string[] })
        const found = await Promise.all(Object.keys(groupedByDocumentType).map((w: TDocumentType) => this.getStrict(w, ...groupedByDocumentType[w])));
        const foundConcat = found.reduce((a, v) => a.concat(v), [] as TEntityBase[])
        const foundDictionary = foundConcat.reduce((a, v) => ({ ...a, [v._id]: v._rev }), {} as { [key: string]: any });
        result.docs = entities.map(w => ({ ...w, _rev: foundDictionary[w._id] } as TEntityBase));

        return result;
    }

    private _isAdditionAllowed(entity: TEntityBase) {
        const indexableEntity = entity as any;

        // cannot add an entity that already has a rev, means its in the database already
        if (!!indexableEntity["_rev"]) {
            return false
        }

        return true;
    }

    formatDeletions(...entities: TEntityBase[]): TEntityBase[] {
        return entities.map(w => {

            let result = { ...w, _id: w._id, _rev: w._rev, DocumentType: w.DocumentType, _deleted: true } as any;

            return result as TEntityBase
        })
    }

    isOperationAllowed(entity: TEntityBase, operation: 'add') {

        if (operation === "add") {
            return this._isAdditionAllowed(entity);
        }

        return false
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

    setDbGeneratedValues(response: IBulkOperationsResponse, entities: TEntityBase[]): void {
        for (let i = 0; i < entities.length; i++) {
            const modification = entities[i];
            const found = response.successes[modification._id];

            // update the rev in case we edit the record again
            if (found && found.ok === true) {
                const indexableEntity = modification as any;
                indexableEntity._rev = found.rev;
            }
        }
    }
}