import { IDataContext } from "../../../types/context-types";
import { IDbSetBuilderParams, IDbSetStatefulBuilderParams } from "../../../types/dbset-builder-types";
import { IDbSet, IDbSetBase, IStatefulDbSet } from "../../../types/dbset-types";
import { IDbRecord } from "../../../types/entity-types";
import { IDbPluginOptions } from "../../../types/plugin-types";
import { DataContext } from "../../DataContext";
import { DbSet } from "../DbSet";
import { StatefulDbSet } from "../StatefulDbSet";
import { DefaultDbSetBuilder } from "./DefaultDbSetBuilder";
import { StatefulDbSetBuilder } from "./StatefulDbSetBuilder";

export class DbSetInitializer<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase, TPluginOptions extends IDbPluginOptions> {

    protected onAddDbSet: (dbset: IDbSetBase<TDocumentType>) => void;
    protected context: IDataContext<TDocumentType, TEntityBase>;

    constructor(onAddDbSet: (dbset: IDbSetBase<TDocumentType>) => void, context: DataContext<TDocumentType, TEntityBase, TExclusions, TPluginOptions>) {
        this.onAddDbSet = onAddDbSet;
        this.context = context;
    }

    default<TEntity extends TEntityBase>(documentType: TEntity["DocumentType"]) {
        return new DefaultDbSetBuilder<TEntity["DocumentType"], TEntity, TExclusions, IDbSet<TEntity["DocumentType"], TEntity, TExclusions>, IDbSetBuilderParams<TEntity["DocumentType"], TEntity, TExclusions, IDbSet<TEntity["DocumentType"], TEntity, TExclusions>>>(this.onAddDbSet, {
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
            entityComparator: null
        }, DbSet);
    }

    protected _stateful<TEntity extends TEntityBase>(documentType: TEntity["DocumentType"]) {
        return new StatefulDbSetBuilder<TEntity["DocumentType"], TEntity, TExclusions, IStatefulDbSet<TEntity["DocumentType"], TEntity, TExclusions>, IDbSetStatefulBuilderParams<TEntity["DocumentType"], TEntity, TExclusions, IStatefulDbSet<TEntity["DocumentType"], TEntity, TExclusions>>>(this.onAddDbSet, {
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
            onChange: () => void(0),
            entityComparator: null
        }, StatefulDbSet);
    }
}