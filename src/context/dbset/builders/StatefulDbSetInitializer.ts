import { IDbSetBase } from "../../../types/dbset-types";
import { IDbRecord } from "../../../types/entity-types";
import { IDbPluginOptions } from "../../../types/plugin-types";
import { DataContext } from "../../DataContext";
import { DbSetInitializer } from "./DbSetInitializer";

export class StatefulDbSetInitializer<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase, TPluginOptions extends IDbPluginOptions> extends DbSetInitializer<TDocumentType, TEntityBase, TExclusions, TPluginOptions> {

    constructor(onAddDbSet: (dbset: IDbSetBase<TDocumentType>) => void, context: DataContext<TDocumentType, TEntityBase, TExclusions, TPluginOptions>) {
        super(onAddDbSet, context);
    }

    stateful<TEntity extends TEntityBase>(documentType: TEntity["DocumentType"]) {
        return super._stateful<TEntity>(documentType)
    }
}