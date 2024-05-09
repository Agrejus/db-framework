import { IDataContext } from "../../../types/context-types";
import { IDbSetBase } from "../../../types/dbset-types";
import { IDbRecord } from "../../../types/entity-types";
import { IDbPluginOptions } from "../../../types/plugin-types";
import { DataContext } from "../../DataContext";
import { DbSet } from "../DbSet";
import { DefaultDbSetBuilder } from "./DefaultDbSetBuilder";
import { IdBuilder } from '../../builder/IdBuilder';
import { SchemaDefinition } from "../../../schema/types/Definition";

export class DbSetInitializer<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase, TPluginOptions extends IDbPluginOptions, TDbPlugin> {

    protected onAddDbSet: (dbset: IDbSetBase<TDocumentType>) => void;
    protected context: IDataContext<TDocumentType, TEntityBase>;

    constructor(onAddDbSet: (dbset: IDbSetBase<TDocumentType>) => void, context: DataContext<TDocumentType, TEntityBase, TExclusions, TPluginOptions, any>) {
        this.onAddDbSet = onAddDbSet;
        this.context = context;
    }

    default<TEntity extends TEntityBase>(schema: SchemaDefinition<TEntity["DocumentType"], any>) {
        return new DefaultDbSetBuilder<TEntity["DocumentType"], TEntity, TExclusions, TDbPlugin>({
            InstanceCreator: DbSet,
            onCreate: this.onAddDbSet,
            params: {
                documentType: schema.documentType,
                context: this.context as IDataContext<TEntity["DocumentType"], TEntity>,
                readonly: false,
                defaults: { add: {} as any, retrieve: {} as any },
                exclusions: [],
                serializer: null,
                deserializer: null,
                filterSelector: null,
                entityComparator: null,
                idCreator: IdBuilder.createUUID,
                schema
            }
        });
    }
}