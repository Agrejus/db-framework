import { DbPluginOperations, IBulkOperationsResponse, IDbPlugin, IDbPluginOptions, IDbRecord, IQueryParams, Transactions } from '@agrejus/db-framework';
import { IFlexSyncRecord } from './types';

export abstract class FlexSyncPlugin<TDocumentType extends string, TEntityBase extends IFlexSyncRecord<TDocumentType>, TExclusions extends keyof TEntityBase = never, TDbPluginOptions extends IDbPluginOptions = IDbPluginOptions> implements IDbPlugin<TDocumentType, TEntityBase, "_timestamp" | "_revision" | TExclusions> {
    
    // what api routes are needed?
    // routes
    // - /db/all -> get all docs
    // - /db/get -> get one or many docs
    // - /db/bulkChanges -> send over add/update/removes
    // - /db/changeFeed -> listen for changes

    // we need a data store of everything that we have sent to the server

    protected readonly options: TDbPluginOptions;

    idPropertyName: keyof TEntityBase;

    types: { exclusions: TExclusions | '_timestamp' | '_revision'; };

    async destroy(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async all(payload?: IQueryParams<TDocumentType> | undefined): Promise<TEntityBase[]> {
        throw new Error('Method not implemented.');
    }

    async getStrict(DocumentType: TDocumentType, ...ids: string[]): Promise<TEntityBase[]> {
        throw new Error('Method not implemented.');
    }

    async get(DocumentType: TDocumentType, ...ids: string[]): Promise<TEntityBase[]> {
        throw new Error('Method not implemented.');
    }

    async bulkOperations(operations: { adds: TEntityBase[]; removes: TEntityBase[]; updates: TEntityBase[]; }, transactions: Transactions): Promise<IBulkOperationsResponse> {
        
        throw new Error('Method not implemented.');
    }

    prepareDetachments(...entities: TEntityBase[]): { ok: boolean; errors: string[]; docs: TEntityBase[]; } {
        throw new Error('Method not implemented.');
    }
    
    async prepareAttachments(...entities: TEntityBase[]): Promise<{ ok: boolean; errors: string[]; docs: TEntityBase[]; }> {
        throw new Error('Method not implemented.');
    }

    isOperationAllowed(entity: TEntityBase, operation: DbPluginOperations): { ok: boolean; error?: string | undefined; } {
        throw new Error('Method not implemented.');
    }

    enrichRemoval(entity: TEntityBase): TEntityBase {
        throw new Error('Method not implemented.');
    }

    enrichGenerated(response: IBulkOperationsResponse, entity: TEntityBase): TEntityBase {
        throw new Error('Method not implemented.');
    }
}