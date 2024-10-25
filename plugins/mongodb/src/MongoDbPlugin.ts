import { IDbPlugin, IBulkOperationsResponse, IQueryParams, DbPluginOperations, Transactions, IDbSetApi, DeepPartial, IDictionary } from '@agrejus/db-framework';
import { validateAttachedEntity } from './validator';
import { MongoDbRecord, IMongoDbPluginOptions } from './types';
import { typeMap } from './maps';
import { Schema, createConnection, Model } from 'mongoose';

const modelMap: { [key: string]: Schema } = {

}

export class MongoDbPlugin<TDocumentType extends string, TEntityBase extends MongoDbRecord<TDocumentType>, TDbPluginOptions extends IMongoDbPluginOptions = IMongoDbPluginOptions> implements IDbPlugin<TDocumentType, TEntityBase, "id" | "timestamp"> {

    protected readonly options: TDbPluginOptions;
    readonly idPropertyName = "id";
    readonly skip: (keyof TEntityBase)[] = ["id", "timestamp"];
    private readonly _api: IDbSetApi<TDocumentType, TEntityBase, any, any>;
    private readonly _connectionString: string;

    readonly types = {
        exclusions: "" as "id" | "timestamp"
    }

    constructor(options: TDbPluginOptions, api: IDbSetApi<TDocumentType, TEntityBase, any, any>) {
        this.options = options;
        this._api = api;
        this._connectionString = options.connectionString;

    }

    async destroy() {
        // no-op
    }

    async all(payload?: IQueryParams<TDocumentType, TEntityBase>) {

        if (Object.keys(modelMap).length === 0) {
            const dbsets = this._api.dbsets.all();

            for (const dbset of dbsets) {
                debugger;
                const model: { [key: string]: any } = {}
                const info = dbset.info();
                const schema = info.SchemaDataStore.expand();

                for (const [_, value] of schema.properties) {
                    model[value.propertyName] = typeMap[value.type];
                }

                modelMap[info.DocumentType] = new Schema(model);
            }
        }

        if (payload.DocumentType == null) {
            return [];
        }
        
        debugger;
        const response = await this.doWork(payload.DocumentType, w => w.find());

        return null as any
    }

    async doWork<T>(documentType: TDocumentType, action: (model: Model<any>) => Promise<T>) {

        const connection = await createConnection(this._connectionString, {
            dbName: this.options.dbName
        }).asPromise();

        try {

            const schema = modelMap[documentType];
            const Model = connection.model(documentType, schema);

            return await action(Model);
        } catch (e: any) {
            throw e
        } finally {
            await connection.close()
        }
    }

    async getStrict(documentType: TDocumentType, ...ids: string[]) {
        if (ids.length === 0) {
            return [];
        }

        const result = await this.get(documentType, ...ids);

        if (result.length === 0 || result.length !== ids.length) {
            throw new Error("Could not get entities for ids");
        }

        return result;
    }

    async get(documentType: TDocumentType, ...ids: string[]) {
        try {

            return [] as TEntityBase[];
        } catch (e) {
            return [] as TEntityBase[];
        }
    }

    async bulkOperations(operations: {
        adds: TEntityBase[];
        removes: TEntityBase[];
        updates: { data: TEntityBase[]; deltas: IDictionary<DeepPartial<TEntityBase>>; };
    }, _: Transactions) {

        const result: IBulkOperationsResponse = {
            errors: {},
            successes: {},
            errors_count: 0,
            successes_count: 0
        };
        const { adds, updates, removes } = operations;

        const groupedAdds = this._group(adds);
        const groupedUpdates = this._group(updates.data);
        const groupedRemoves = this._group(removes);
debugger;
        for(const groupedAdd in groupedAdds) {

            const data = groupedAdds[groupedAdd]
            await this.doWork(groupedAdd, w => w.bulkWrite([{
                insertOne: { document: data[0] as any }
            }]))

        }

        return null as any
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

        const entityMap = entities.reduce((a, v) => {

            if (a[v.DocumentType] == null) {
                a[v.DocumentType] = [];
            }

            a[v.DocumentType].push(v);

            return a;

        }, {} as { [key in TDocumentType]: TEntityBase[] })
        const foundAll = await Promise.all(Object.keys(entityMap).map((w: TDocumentType) => this.getStrict(w, ...entityMap[w].map(w => w.id))));
        const found = foundAll.reduce((a, v) => a.concat(v), []);
        const foundDictionary = found.reduce((a, v) => ({ ...a, [v.id]: v.timestamp }), {} as { [key: string]: any });
        result.docs = entities.map(w => ({ ...w, timestamp: foundDictionary[w.id] } as TEntityBase));

        return result;
    }

    private _isAdditionAllowed(entity: TEntityBase) {
        const indexableEntity = entity as any;

        // cannot add an entity that already has a timestamp, means its in the database already
        if (!!indexableEntity["timestamp"]) {
            return {
                ok: false,
                error: "Cannot add entity that is already in the database, please modify entites by reference or attach an existing entity"
            }
        }

        return { ok: true };
    }

    private _isRemovalAllowed(entity: TEntityBase) {
        const indexableEntity = entity as any;

        // cannot add an entity that already has a timestamp, means its in the database already
        if (!indexableEntity["timestamp"]) {
            return {
                ok: false,
                error: "Cannot remove entity that is not in the database, please supply timestamp property"
            }
        }

        return { ok: true };
    }

    isOperationAllowed(entity: TEntityBase, operation: DbPluginOperations) {

        const map = {
            "add": this._isAdditionAllowed,
            "remove": this._isRemovalAllowed
        }

        const cb = map[operation]

        if (cb == null) {
            return { ok: true }
        }

        return cb(entity);
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

    enrichGenerated(response: IBulkOperationsResponse, entity: TEntityBase): TEntityBase {
        const found = response.successes[entity.id];
        const documentType = entity.DocumentType;
        const dbset = this._api.dbsets.get(documentType);
        const info = dbset.info();
        const schema = info.SchemaDataStore.expand();

        if (found && found.ok === true && 'record' in found) {
            const record = found.record as any;
            return schema.autoGeneratedSetter(entity, record);
        }

        return entity;
    }

    enrichRemoval(entity: TEntityBase): TEntityBase {
        return entity as TEntityBase
    }

    private _group(items: TEntityBase[]) {
        const result: { [key in TDocumentType]: TEntityBase[] } = {} as any;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (result[item.DocumentType] == null) {
                result[item.DocumentType] = [];
            }
            result[item.DocumentType].push(item);
        }

        return result;
    }
}