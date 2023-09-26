import { IDbRecord } from '../types/entity-types'

export interface IQueryParams<TDocumentType extends string> {
    DocumentType?: TDocumentType;
    index?: string;
}

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

export interface IDbPlugin<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> {
    destroy(): Promise<void>;
    all(payload?: IQueryParams<TDocumentType>): Promise<TEntityBase[]>;
    getStrict(...ids: string[]): Promise<TEntityBase[]>;
    get(...ids: string[]): Promise<TEntityBase[]>;
    bulkOperations(operations: { adds: TEntityBase[], removes: TEntityBase[], updates: TEntityBase[] }): Promise<IBulkOperationsResponse>
}

export type IDbPluginOptions = {
    dbName: string;
}

export type DbPluginInstanceCreator<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> = new (options: IDbPluginOptions) => IDbPlugin<TDocumentType, TEntityBase>;