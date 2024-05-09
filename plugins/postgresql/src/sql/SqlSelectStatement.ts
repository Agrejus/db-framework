import { PostgreSqlRecord } from '../types';
import { SqlStatement } from './SqlStatement';

export class SqlSelectStatement<TDocumentType extends string, TEntity extends PostgreSqlRecord<TDocumentType>> extends SqlStatement<TDocumentType, TEntity> {

    create() {

        if (this.entity != null) {
            for (const key in this.entity) {

                const value = this.entity[key];
    
                if (value == null || this.isDocumentTypeProperty(key)) {
                    continue;
                }
    
                this.parameters.add(key, value, "where");
            }
        }

        const fields = [...this.schema.properties.keys()].filter(w => this.isDocumentTypeProperty(w) === false)

        const whereAssignments = this.parameters.getAssignments("where");
        const parameters = this.parameters.getValues("where");
        const whereClause = this.parameters.length === 0 ? "" : ` WHERE ${whereAssignments.join(',')}`
        
        return {
            statement: `SELECT ${fields.join(', ')} FROM ${this.entity.DocumentType}${whereClause}`,
            parameters,
            entity: this.entity
        };
    }
}