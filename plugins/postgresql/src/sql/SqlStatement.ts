import { IDbSetApi } from '@agrejus/db-framework';
import { PostgreSqlRecord } from '../types';
import { ParameterCollection } from './ParameterCollection';
import { SqlStatementBase } from './SqlStatementBase';

export abstract class SqlStatement<TDocumentType extends string, TEntity extends PostgreSqlRecord<TDocumentType>> extends SqlStatementBase<TDocumentType, TEntity> {

    protected readonly entity: TEntity;

    parameters = new ParameterCollection();

    constructor(entity: TEntity, api: IDbSetApi<TDocumentType, TEntity, any, any>) {
        super(api, entity.DocumentType);
        this.entity = entity;
    }

    abstract create(): { statement: string, parameters: any[], entity: TEntity }
}