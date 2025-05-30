import { DbPluginBulkOperationsEvent, EntityModificationResult, IDbPlugin, IdbPluginCollection } from '../types';

export type OperationsPayload = {
    plugins: IDbPlugin[];
    index: number;
    errors: any[];
}

export type PersistPayload<TEntity extends {}> = OperationsPayload & {
    event: DbPluginBulkOperationsEvent<TEntity>;
    result?: EntityModificationResult<TEntity>;
}

export type IDbPluginReplicator = IDbPlugin & {
    plugins: IdbPluginCollection;
}