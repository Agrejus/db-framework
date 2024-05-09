import { ExpandedSchema, IDbSetApi } from '@agrejus/db-framework';
import { PostgreSqlRecord } from '../types';
import { ParameterCollection } from './ParameterCollection';

const schemas: { [key: string]: ExpandedSchema } = {} as any

export abstract class SqlStatementBase<TDocumentType extends string, TEntity extends PostgreSqlRecord<TDocumentType>> {

    protected readonly schema: ExpandedSchema;
    private readonly _api: IDbSetApi<TDocumentType, TEntity, any, any>;

    parameters = new ParameterCollection();

    constructor(api: IDbSetApi<TDocumentType, TEntity, any, any>, documentType: TDocumentType) {
        this._api = api;

        if (schemas[documentType] == null) {
            const dbset = this._api.dbsets.get(documentType);
            const SchemaDataStore = dbset.info().SchemaDataStore;
            schemas[documentType] = SchemaDataStore.expand();
        }

        this.schema = schemas[documentType];
    }

    protected isDocumentTypeProperty(name: string) {
        return name === "DocumentType";
    }

    protected isIdProperty(name: string) {
        return name === this.schema.idPropertyName;
    }
}