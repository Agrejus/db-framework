import { EntityModificationResult, IDbPlugin } from "@agrejus/db-framework-core";
import { DbPluginBulkOperationsEvent } from "@agrejus/db-framework-core/dist/plugins/types";

export class DataAccessStrategyBase<T extends {}> {

    protected readonly dbPlugin: IDbPlugin;

    constructor(dbPlugin: IDbPlugin) {
        this.dbPlugin = dbPlugin;
    }

    protected _bulkOperations(event: DbPluginBulkOperationsEvent<T>, done: (result: EntityModificationResult<T>, error?: any) => void) {
        this.dbPlugin.bulkOperations(event, done);
    }
}