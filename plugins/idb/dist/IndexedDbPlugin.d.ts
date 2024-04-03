/// <reference types="pouchdb-find" />
/// <reference types="pouchdb-core" />
import { IDbPlugin, IBulkOperationsResponse, IQueryParams, DbPluginOperations, Transactions, IDbPluginOptions } from '@agrejus/db-framework';
import { IndexedDbRecord } from './types';
import { IDBPDatabase, IDBPTransaction } from 'idb';
interface IValidationResult<TDocumentType extends string, TEntity extends IndexedDbRecord<TDocumentType>> {
    propertyName: keyof TEntity;
    ok: boolean;
    error: string;
    entity: TEntity;
}
export declare const validateAttachedEntity: <TDocumentType extends string, TEntity extends IndexedDbRecord<TDocumentType>>(entity: TEntity) => IValidationResult<TDocumentType, TEntity>[];
export declare class IndexedDbPlugin<TDocumentType extends string, TEntityBase extends IndexedDbRecord<TDocumentType>, TDbPluginOptions extends IDbPluginOptions = IDbPluginOptions> implements IDbPlugin<TDocumentType, TEntityBase, "_id" | "_timestamp"> {
    protected readonly options: TDbPluginOptions;
    readonly idPropertyName = "_id";
    readonly types: {
        exclusions: "_id" | "_timestamp";
    };
    constructor(options: TDbPluginOptions);
    protected createDb(): Promise<IDBPDatabase<unknown>>;
    doWork<T>(mode: "readonly" | "readwrite" | "versionchange", action: (db: IDBPTransaction<unknown, ["data"], typeof mode>) => Promise<T>): Promise<T>;
    destroy(): Promise<void>;
    all(payload?: IQueryParams<TDocumentType>): Promise<TEntityBase[]>;
    query(request: PouchDB.Find.FindRequest<TEntityBase>): Promise<TEntityBase[]>;
    getStrict(_: TDocumentType, ...ids: string[]): Promise<any[]>;
    get(_: TDocumentType, ...ids: string[]): Promise<any[]>;
    bulkOperations(operations: {
        adds: TEntityBase[];
        removes: TEntityBase[];
        updates: TEntityBase[];
    }, _: Transactions): Promise<any>;
    protected formatBulkDocsResponse(response: (PouchDB.Core.Response | PouchDB.Core.Error)[]): IBulkOperationsResponse;
    prepareAttachments(...entities: TEntityBase[]): Promise<{
        ok: boolean;
        docs: TEntityBase[];
        errors: string[];
    }>;
    private _isAdditionAllowed;
    private _isRemovalAllowed;
    isOperationAllowed(entity: TEntityBase, operation: DbPluginOperations): {
        ok: boolean;
        error: string;
    } | {
        ok: boolean;
    };
    prepareDetachments(...entities: TEntityBase[]): {
        ok: boolean;
        errors: string[];
        docs: TEntityBase[];
    };
    enrichGenerated(response: IBulkOperationsResponse, entity: TEntityBase): TEntityBase;
    enrichRemoval(entity: TEntityBase): TEntityBase;
}
export {};
