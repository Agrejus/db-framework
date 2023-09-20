import { IDataContext } from "../../../types/context-types";
import { IDbSet, IDbSetBase } from "../../../types/dbset-types";
import { IDbRecord } from "../../../types/entity-types";
import { IDbPluginOptions } from "../../../types/plugin-types";
import { DataContext } from "../../DataContext";
import { DefaultDbSetBuilder } from "./DefaultDbSetBuilder";

export class DbSetInitializer<TDocumentType extends string, TPluginOptions extends IDbPluginOptions, TEntityBase extends IDbRecord<TDocumentType>> {

    protected onAddDbSet: (dbset: IDbSetBase<TDocumentType>) => void;
    protected context: IDataContext<TDocumentType, TEntityBase>;

    constructor(onAddDbSet: (dbset: IDbSetBase<TDocumentType>) => void, context: DataContext<TDocumentType, TPluginOptions, TEntityBase>) {
        this.onAddDbSet = onAddDbSet;
        this.context = context;
    }

    default<TEntity extends TEntityBase>(documentType: TEntity["DocumentType"]) {
        return new DefaultDbSetBuilder<TDocumentType, TEntity, never, IDbSet<TDocumentType, TEntity>>(this.onAddDbSet, {
            documentType,
            context: this.context as IDataContext<TDocumentType, TEntity>,
            readonly: false
        });
    }
}