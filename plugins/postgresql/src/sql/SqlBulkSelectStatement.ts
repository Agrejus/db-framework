import { PostgreSqlRecord } from '../types';
import { SqlBulkStatement } from './SqlBulkStatement';

export class SqlBulkSelectStatement<TDocumentType extends string, TEntity extends PostgreSqlRecord<TDocumentType>> extends SqlBulkStatement<TDocumentType, TEntity> {

    private _createWhereStatementFromGroups() {

        const statements: string[] = [];

        for(const group of this.parameters.getGroups()) {

            if (group.parameters.length === 1) {
                statements.push(`${group.group} = ${group.parameters[0].variableName}`);
                continue;
            }

            statements.push(`${group.group} IN (${group.parameters.map(w => w.variableName).join(",")})`);
        }

        return statements.join(" && ");
    }

    create() {

        const groups: { [key: string]: any[] } = {}
        for (const entity of this.entities) {

            for (const key in entity) {

                if (this.isDocumentTypeProperty(key)) {
                    continue;
                }

                if (groups[key] == null) {
                    groups[key] = [];
                }

                groups[key].push(entity[key])
            }
        }

        for (const key in groups) {
            const group = groups[key];
            for(const value of group) {
                this.parameters.add(key, value, key)
            }
        }

        const fields = [...this.schema.properties.keys()].filter(w => this.isDocumentTypeProperty(w) === false);
        const whereClause = this.parameters.length === 0 ? "" : ` WHERE ${this._createWhereStatementFromGroups()}`;
        const parameters = this.parameters.getValues();

        return {
            statement: `SELECT ${fields.join(', ')} FROM ${this.DocumentType}${whereClause}`,
            parameters,
            entities: this.entities
        };
    }
}