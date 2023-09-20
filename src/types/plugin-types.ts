import { IDbRecord } from '../types/entity-types'

export interface IBulkOperation {
    ok: boolean;
    id: string;
    rev: string;
    error?: string;
}

export interface IBulkOperationsResponse {
    errors: { [key: string]: IBulkOperation },
    errors_count: number,
    successes: { [key: string]: IBulkOperation },
    successes_count: number
}

export interface IDbPlugin<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TQueryRequest, TQueryResponse> {
    destroy(): Promise<void>;
    all(): Promise<TEntityBase[]>;
    query(request: TQueryRequest): Promise<TQueryResponse>;
    getStrict(...ids: string[]): Promise<TEntityBase[]>;
    get(...ids: string[]): Promise<TEntityBase[]>;
    bulkOperations(operations: { adds: TEntityBase[], removes: TEntityBase[], updates: TEntityBase[] }): Promise<IBulkOperationsResponse>
}

export type IDbPluginOptions = {
    supportsRevisions: boolean;
    dbName: string;
}

export type DbPluginInstanceCreator<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TQueryRequest, TQueryResponse> = new (options: IDbPluginOptions) => IDbPlugin<TDocumentType, TEntityBase, TQueryRequest, TQueryResponse>;