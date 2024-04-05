import { Transactions } from '../common/Transactions';
import { groupBy, toDictionary } from '../common/helpers';
import { IDbRecord } from '../types/entity-types'

export interface IQueryParams<TDocumentType extends string> {
    DocumentType?: TDocumentType;
    index?: string;
}

export interface IBulkOperation {
    ok: boolean;
    id: string;
    error?: string;
    [key: string | number]: unknown;
}

export interface IBulkOperationsResponse {
    errors: { [key: string]: IBulkOperation },
    errors_count: number,
    successes: { [key: string]: IBulkOperation },
    successes_count: number
}

export type DbPluginOperations = "add" | "remove";
export interface IDbPlugin<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase = never> {
    readonly idPropertyName: keyof TEntityBase;
    readonly types: { exclusions: TExclusions }
    destroy(): Promise<void>;
    all(payload?: IQueryParams<TDocumentType>): Promise<TEntityBase[]>;
    getStrict(DocumentType: TDocumentType, ...ids: string[]): Promise<TEntityBase[]>;
    get(DocumentType: TDocumentType, ...ids: string[]): Promise<TEntityBase[]>;
    bulkOperations(operations: { adds: TEntityBase[], removes: TEntityBase[], updates: TEntityBase[] }, transactions: Transactions): Promise<IBulkOperationsResponse>;

    prepareDetachments(...entities: TEntityBase[]): { ok: boolean, errors: string[], docs: TEntityBase[] }
    prepareAttachments(...entities: TEntityBase[]): Promise<{ ok: boolean, errors: string[], docs: TEntityBase[] }>;
    isOperationAllowed(entity: TEntityBase, operation: DbPluginOperations): { ok: boolean, error?: string };
    enrichRemoval(entity: TEntityBase): TEntityBase;
    enrichGenerated(response: IBulkOperationsResponse, entity: TEntityBase): TEntityBase;
}

export type IDbPluginOptions = {
    dbName: string;
}

export interface IValidationResult<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {
    propertyName: keyof TEntity;
    ok: boolean;
    error: string;
    entity: TEntity
}