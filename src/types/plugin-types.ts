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

export type DbPluginOperations = "add";
export interface IDbPlugin<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase = never> {
    readonly idPropertName: keyof TEntityBase;
    readonly types: { exclusions: TExclusions }
    destroy(): Promise<void>;
    all(payload?: IQueryParams<TDocumentType>): Promise<TEntityBase[]>;
    getStrict(...ids: string[]): Promise<TEntityBase[]>;
    get(...ids: string[]): Promise<TEntityBase[]>;
    bulkOperations(operations: { adds: TEntityBase[], removes: TEntityBase[], updates: TEntityBase[] }): Promise<IBulkOperationsResponse>;

    prepareDetachments(...entities: TEntityBase[]): { ok: boolean, errors: string[], docs: TEntityBase[] }
    prepareAttachments(...entities: TEntityBase[]): Promise<{ ok: boolean, errors: string[], docs: TEntityBase[] }>;
    isOperationAllowed(entity: TEntityBase, operation: DbPluginOperations): boolean;
    formatDeletions(...entities: TEntityBase[]): TEntityBase[];
    setDbGeneratedValues(response: IBulkOperationsResponse, entities: TEntityBase[]): void;
}

export type IDbPluginOptions = {
    dbName: string;
}

export type DbPluginInstanceCreator<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase, TDbPlugin extends IDbPlugin<TDocumentType, TEntityBase, TExclusions>> = new (options: IDbPluginOptions) => TDbPlugin;