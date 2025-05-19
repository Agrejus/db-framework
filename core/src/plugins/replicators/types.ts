import { CompiledSchema } from '../../schema';
import { EntityChanges, EntityModificationResult, IDbPlugin, IdbPluginCollection } from '../types';

export type OperationsPayload = {
    plugins: IDbPlugin[];
    index: number;
    errors: any[];
}

export type PersistPayload<TEntity extends {}> = OperationsPayload & {
    operations: EntityChanges<TEntity>;
    result?: EntityModificationResult<TEntity>;
    schema: CompiledSchema<TEntity>;
}

export type IDbPluginReplicator = IDbPlugin & {
    plugins: IdbPluginCollection;
}