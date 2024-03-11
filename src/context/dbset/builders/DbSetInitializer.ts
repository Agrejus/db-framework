import { IDataContext } from "../../../types/context-types";
import { IDbSetBase } from "../../../types/dbset-types";
import { IDbRecord } from "../../../types/entity-types";
import { IDbPlugin, IDbPluginOptions } from "../../../types/plugin-types";
import { DataContext } from "../../DataContext";
import { DbSet } from "../DbSet";
import { StatefulDbSet } from "../StatefulDbSet";
import { DefaultDbSetBuilder } from "./DefaultDbSetBuilder";
import { StatefulDbSetBuilder } from "./StatefulDbSetBuilder";
import { IdBuilder } from '../../builder/IdBuilder';

export class DbSetInitializer<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase, TPluginOptions extends IDbPluginOptions, TDbPlugin> {

    protected onAddDbSet: (dbset: IDbSetBase<TDocumentType>) => void;
    protected context: IDataContext<TDocumentType, TEntityBase>;

    constructor(onAddDbSet: (dbset: IDbSetBase<TDocumentType>) => void, context: DataContext<TDocumentType, TEntityBase, TExclusions, TPluginOptions, any>) {
        this.onAddDbSet = onAddDbSet;
        this.context = context;
    }

    default<TEntity extends TEntityBase>(documentType: TEntity["DocumentType"]) {
        return new DefaultDbSetBuilder<TEntity["DocumentType"], TEntity, TExclusions, TDbPlugin>({
            InstanceCreator: DbSet,
            onCreate: this.onAddDbSet,
            params: {
                documentType,
                context: this.context as IDataContext<TEntity["DocumentType"], TEntity>,
                readonly: false,
                defaults: { add: {} as any, retrieve: {} as any },
                exclusions: [],
                serializer: null,
                deserializer: null,
                filterSelector: null,
                entityComparator: null,
                idCreator: IdBuilder.createUUID
            }
        });
    }

    protected _stateful<TEntity extends TEntityBase>(documentType: TEntity["DocumentType"]) {
        return new StatefulDbSetBuilder<TEntity["DocumentType"], TEntity, TExclusions, TDbPlugin>({
            InstanceCreator: StatefulDbSet,
            onCreate: this.onAddDbSet,
            params: {
                documentType,
                context: this.context as IDataContext<TEntity["DocumentType"], TEntity>,
                readonly: false,
                defaults: { add: {} as any, retrieve: {} as any },
                exclusions: [],
                serializer: null,
                deserializer: null,
                filterSelector: null,
                onChange: () => {},
                entityComparator: null,
                idCreator: IdBuilder.createUUID
            }
        });
    }
}