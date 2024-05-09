import { IDbPlugin, IBulkOperationsResponse, IQueryParams, DbPluginOperations, Transactions, IDbSetApi, DeepPartial } from '@agrejus/db-framework';
import { validateAttachedEntity } from './validator';
import { PostgreSqlRecord, IPostgreSqlPluginOptions } from './types';
import pg from 'pg'
import { SqlInsertStatement } from './sql/SqlInsertStatement';
import { SqlDeleteStatement } from './sql/SqlDeleteStatement';
import { SqlSelectStatement } from './sql/SqlSelectStatement';
import { SqlUpdateStatement } from './sql/SqlUpdateStatement';
import { SqlBulkSelectStatement } from './sql/SqlBulkSelectStatement';
import { IDictionary } from '../../../dist/types/common-types';
import { booleanParser, integerParser, floatParser } from './parsers';
const { Client, types } = pg

export class PostgreSqlPlugin<TDocumentType extends string, TEntityBase extends PostgreSqlRecord<TDocumentType>, TDbPluginOptions extends IPostgreSqlPluginOptions = IPostgreSqlPluginOptions> implements IDbPlugin<TDocumentType, TEntityBase, "id" | "timestamp"> {

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

        types.setTypeParser(types.builtins.BIT, booleanParser);
        types.setTypeParser(types.builtins.BOOL, booleanParser);
        types.setTypeParser(types.builtins.FLOAT4, floatParser);
        types.setTypeParser(types.builtins.FLOAT8, floatParser);
        types.setTypeParser(types.builtins.INT2, integerParser);
        types.setTypeParser(types.builtins.INT4, integerParser);
        types.setTypeParser(types.builtins.INT8, integerParser);
        types.setTypeParser(types.builtins.MONEY, floatParser);
        types.setTypeParser(types.builtins.NUMERIC, floatParser);
    }

    async destroy() {
        // no-op
    }

    async _allByDocumentType(documentType: TDocumentType) {
        const select = new SqlSelectStatement<TDocumentType, TEntityBase>({ DocumentType: documentType } as TEntityBase, this._api);
        const sql = select.create();

        const response = await this.doWork(w => w.query(sql.statement, sql.parameters));

        return response.rows.map(w => ({ ...w, DocumentType: documentType })) as TEntityBase[];
    }

    async all(payload?: IQueryParams<TDocumentType, TEntityBase>) {

        if (payload?.DocumentType === null) {
            const result: TEntityBase[] = [];
            for (const dbset of this._api.dbsets.all()) {
                const info = dbset.info();
                const docs = await this._allByDocumentType(info.DocumentType as TDocumentType);
                result.push(...docs);
            }
            return result;
        }

        return await this._allByDocumentType(payload.DocumentType as TDocumentType);
    }

    async doWork<T>(action: (client: pg.Client) => Promise<T>) {
        const client = new Client({
            connectionString: this._connectionString
        })

        try {

            await client.connect();

            return await action(client);
        } catch (e: any) {
            throw e
        } finally {
            await client.end();
        }
    }

    async toResult<T>(identifier: TEntityBase, action: () => Promise<T>): Promise<{ data: T, identifier: TEntityBase } | { error: any, identifier: TEntityBase }> {

        try {
            const result = await action();
            return {
                data: result,
                identifier
            }
        } catch (e) {
            return {
                error: e,
                identifier
            }
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

            const dbset = this._api.dbsets.get(documentType);
            const info = dbset.info();
            const schema = info.SchemaDataStore.expand();
            const statement = new SqlBulkSelectStatement(ids.map(w => ({ [schema.idPropertyName]: w, DocumentType: documentType } as any)), this._api);
            const sql = statement.create();

            const response = await this.doWork(w => w.query(sql.statement, sql.parameters));

            return response.rows.map(w => ({ ...w, DocumentType: documentType })) as TEntityBase[];
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
        const insertStatements: SqlInsertStatement<TDocumentType, TEntityBase>[] = [];
        const updateStatements: SqlUpdateStatement<TDocumentType, TEntityBase>[] = [];
        const removeStatements: SqlDeleteStatement<TDocumentType, TEntityBase>[] = [];

        for (const documentType in groupedAdds) {
            const items = groupedAdds[documentType];

            for (const item of items) {
                insertStatements.push(new SqlInsertStatement(item, this._api));
            }
        }

        for (const documentType in groupedUpdates) {
            const items = groupedUpdates[documentType];

            for (const item of items) {
                const partial = { ...updates.deltas[item.id], DocumentType: item.DocumentType };
                updateStatements.push(new SqlUpdateStatement(partial as TEntityBase, this._api));
            }
        }

        for (const documentType in groupedRemoves) {
            const items = groupedRemoves[documentType];

            for (const item of items) {
                removeStatements.push(new SqlDeleteStatement(item, this._api));
            }
        }

        const sqlInserts = insertStatements.map(s => s.create());
        const sqlUpdates = updateStatements.map(s => s.create());
        const sqlDeletes = removeStatements.map(s => s.create());

        const response = await this.doWork(async w => {
            const inserts = await Promise.all(sqlInserts.map(sql => this.toResult(sql.entity, () => w.query<TEntityBase>(sql.statement, sql.parameters))));
            const updates = await Promise.all(sqlUpdates.map(sql => this.toResult(sql.entity, () => w.query<TEntityBase>(sql.statement, sql.parameters))));
            const deletes = await Promise.all(sqlDeletes.map(sql => this.toResult(sql.entity, () => w.query<TEntityBase>(sql.statement, sql.parameters))));

            return {
                inserts,
                updates,
                deletes
            }

        });

        for (const item of response.inserts) {
            if ('error' in item) {
                result.errors_count++;
                result.errors[item.identifier.id] = {
                    id: item.identifier.id,
                    ok: false,
                    error: item.error
                }
                continue;
            }

            result.successes_count++;
            result.successes[item.identifier.id] = {
                id: item.identifier.id,
                ok: true,
                record: { ...item.data.rows[0], DocumentType: item.identifier.DocumentType }
            }
        }

        for (const item of response.updates) {
            if ('error' in item) {
                result.errors_count++;
                result.errors[item.identifier.id] = {
                    id: item.identifier.id,
                    ok: false,
                    error: item.error
                }
                continue;
            }

            result.successes_count++;
            result.successes[item.identifier.id] = {
                id: item.identifier.id,
                ok: true,
                record: { ...item.data.rows[0], DocumentType: item.identifier.DocumentType }
            }
        }

        for (const item of response.deletes) {
            if ('error' in item) {
                result.errors_count++;
                result.errors[item.identifier.id] = {
                    id: item.identifier.id,
                    ok: false,
                    error: item.error
                }
                continue;
            }

            result.successes_count++;
            result.successes[item.identifier.id] = {
                id: item.identifier.id,
                ok: true
            }
        }

        return result
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