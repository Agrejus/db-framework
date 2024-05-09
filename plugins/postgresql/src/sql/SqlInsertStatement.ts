import { PostgreSqlRecord } from '../types';
import { SqlStatement } from './SqlStatement';

export class SqlInsertStatement<TDocumentType extends string, TEntity extends PostgreSqlRecord<TDocumentType>> extends SqlStatement<TDocumentType, TEntity> {

    create() {

        for (const key in this.entity) {

            const value = this.entity[key];

            if (value == null || this.isDocumentTypeProperty(key)) {
                continue;
            }

            this.parameters.add(key, value, "insert");
        }

        const propertyNames = this.parameters.getPropertyNames();
        const parameters = this.parameters.getValues();
        const variableNames = this.parameters.getVariableNames();
        
        return {
            statement: `INSERT INTO ${this.entity.DocumentType} (${propertyNames.join(', ')}) VALUES (${variableNames.join(', ')}) RETURNING *`,
            parameters,
            entity: this.entity
        };
    }
}