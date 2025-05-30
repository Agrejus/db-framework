import { EntityModificationResult } from "@agrejus/db-framework-core";
import { IDataAccessStrategy } from "../types";
import { DataAccessStrategyBase } from "./DataAccessStrategyBase";
import { DbSetOptions } from "../../types";
import { DbPluginBulkOperationsEvent, DbPluginQueryEvent } from "@agrejus/db-framework-core/dist/plugins/types";

export class DatabaseDataAccessStrategy<T extends {}> extends DataAccessStrategyBase<T> implements IDataAccessStrategy<T> {

    bulkOperations(_: DbSetOptions, event: DbPluginBulkOperationsEvent<T>, done: (result: EntityModificationResult<T>, error?: any) => void) {
        super._bulkOperations(event, done);
    }

    query<TShape>(_: DbSetOptions, event: DbPluginQueryEvent<T, TShape>, done: (response: TShape, error?: any) => void) {
        this.dbPlugin.query<T, TShape>(event, done);
    }
}