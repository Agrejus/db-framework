import { ExpandedSchema, IDbSetApi } from '@agrejus/db-framework';
import { PostgreSqlRecord } from '../types';
import { ParameterCollection } from './ParameterCollection';
import { SqlStatementBase } from './SqlStatementBase';

const schemas: { [key: string]: ExpandedSchema } = {} as any

export abstract class SqlBulkStatement<TDocumentType extends string, TEntity extends PostgreSqlRecord<TDocumentType>> extends SqlStatementBase<TDocumentType, TEntity> {

    protected readonly entities: TEntity[];
    protected readonly DocumentType: TDocumentType;

    parameters = new ParameterCollection();

    constructor(entities: TEntity[], api: IDbSetApi<TDocumentType, TEntity, any, any>) {
        super(api, entities[0].DocumentType)
        this.DocumentType = entities[0].DocumentType;
        this.entities = entities;
    }

    abstract create(): { statement: string, parameters: any[], entities: TEntity[] }
}