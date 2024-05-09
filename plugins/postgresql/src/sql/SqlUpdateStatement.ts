import { PostgreSqlRecord } from '../types';
import { SqlStatement } from './SqlStatement';

export class SqlUpdateStatement<TDocumentType extends string, TEntity extends PostgreSqlRecord<TDocumentType>> extends SqlStatement<TDocumentType, TEntity> {


    create() {

        for (const key in this.entity) {

            const value = this.entity[key];

            if (this.isIdProperty(key)) {
                this.parameters.add(key, value, "where");
                continue;
            }

            if (value == null || this.isDocumentTypeProperty(key)) {
                continue;
            }

            this.parameters.add(key, value, "update");
        }

        const updateAssignments = this.parameters.getAssignments("update");
        const whereAssignments = this.parameters.getAssignments("where");
        const parameters = this.parameters.getValues();
        const statement = `UPDATE ${this.entity.DocumentType} SET ${updateAssignments.join(',')} WHERE ${whereAssignments.join(',')} RETURNING *`;

        if (statement.includes("WHERE") === false) {
            throw new Error("WHERE clause missing from UPDATE statement")
        }
        
        return {
            statement: statement,
            parameters,
            entity: this.entity
        };
    }
}