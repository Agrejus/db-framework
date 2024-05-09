import { PostgreSqlRecord } from '../types';
import { SqlStatement } from './SqlStatement';

export class SqlDeleteStatement<TDocumentType extends string, TEntity extends PostgreSqlRecord<TDocumentType>> extends SqlStatement<TDocumentType, TEntity> {


    create() {

        const id = this.schema.idPropertyName as keyof TEntity;
        const value = this.entity[id];

        this.parameters.add(String(id), value, "where");

        const whereAssignments = this.parameters.getAssignments("where");
        const parameters = this.parameters.getValues();
        const statement = `DELETE FROM ${this.entity.DocumentType} WHERE ${whereAssignments.join(',')}`;
        
        if (statement.includes("WHERE") === false) {
            throw new Error("WHERE clause missing from DELETE statement")
        }

        return {
            statement: statement,
            parameters,
            entity: this.entity
        };
    }
}