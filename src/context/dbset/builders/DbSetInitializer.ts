import { IDataContext } from "../../../types/context-types";
import { IDbSetBuilderParams, IDbSetStoreBuilderParams } from "../../../types/dbset-builder-types";
import { IDbSet, IDbSetBase, IStoreDbSet } from "../../../types/dbset-types";
import { IDbRecord } from "../../../types/entity-types";
import { IDbPluginOptions } from "../../../types/plugin-types";
import { DataContext } from "../../DataContext";
import { DbSet } from "../DbSet";
import { StoreDbSet } from "../StoreDbSet";
import { DefaultDbSetBuilder } from "./DefaultDbSetBuilder";
import { StoreDbSetBuilder } from "./StoreDbSetBuilder";

export class DbSetInitializer<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TPluginOptions extends IDbPluginOptions, TQueryRequest, TQueryResponse> {

    protected onAddDbSet: (dbset: IDbSetBase<TDocumentType>) => void;
    protected context: IDataContext<TDocumentType, TEntityBase>;

    constructor(onAddDbSet: (dbset: IDbSetBase<TDocumentType>) => void, context: DataContext<TDocumentType, TEntityBase, TPluginOptions, TQueryRequest, TQueryResponse>) {
        this.onAddDbSet = onAddDbSet;
        this.context = context;
    }

    default<TEntity extends TEntityBase>(documentType: TEntity["DocumentType"]) {
        return new DefaultDbSetBuilder<TEntity["DocumentType"], TEntity, never, IDbSet<TEntity["DocumentType"], TEntity>, IDbSetBuilderParams<TEntity["DocumentType"], TEntity, never, IDbSet<TEntity["DocumentType"], TEntity>>>(this.onAddDbSet, {
            documentType,
            context: this.context as IDataContext<TEntity["DocumentType"], TEntity>,
            readonly: false,
            defaults: { add: {} as any, retrieve: {} as any },
            exclusions: [],
            extend: [],
            idKeys: [],
            keyType: "auto",
            map: [],
            filterSelector: null
        }, DbSet);
    }

    store<TEntity extends TEntityBase>(documentType: TEntity["DocumentType"]) {
        return new StoreDbSetBuilder<TEntity["DocumentType"], TEntity, never, IStoreDbSet<TEntity["DocumentType"], TEntity>, IDbSetStoreBuilderParams<TEntity["DocumentType"], TEntity, never, IStoreDbSet<TEntity["DocumentType"], TEntity>>>(this.onAddDbSet, {
            documentType,
            context: this.context as IDataContext<TEntity["DocumentType"], TEntity>,
            readonly: false,
            defaults: { add: {} as any, retrieve: {} as any },
            exclusions: [],
            extend: [],
            idKeys: [],
            keyType: "auto",
            map: [],
            filterSelector: null,
            onChange: () => void(0)
        }, StoreDbSet);
    }
}