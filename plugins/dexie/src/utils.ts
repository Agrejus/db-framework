import { CompiledSchema, DbPluginQueryEvent, PropertyInfo, SchemaTypes, IQuery } from "@agrejus/db-framework-core";
import Dexie, { Collection, Table } from 'dexie';

export const convertToDexieSchema = <T extends {}>(schema: CompiledSchema<T>) => {
    const schemaProperties: string[] = [];
    const existingIndexes: PropertyInfo<any>[] = [];

    for (let i = 0, length = schema.properties.length; i < length; i++) {
        const property = schema.properties[i];

        if (property.level > 1) {
            console.warn(`Dexie does not support querying on nested objects.  Property: ${property.getPathArray().join(".")}`);
            continue;
        }

        if (existingIndexes.includes(property)) {
            continue;
        }

        let modifier = "";

        if (property.isKey && property.isIdentity) {
            modifier += "++";
        }

        if (property.type === SchemaTypes.Array) {
            modifier += "*";
        }

        if (property.isDistinct === true) {
            modifier += "&";
        }

        // Handle single property
        if (property.indexes.length === 0) {

            if (!!modifier) {
                // Handle the primary key
                schemaProperties.push(`${modifier}${property.name}`);
            }

            continue;
        }

        // Test for compound indexes
        const connections = schema.properties.filter(w =>
            w !== property && // Don't match with self
            w.indexes.some(index => property.indexes.includes(index))
        );

        const properties = [property.name, ...connections.map(w => w.name)];

        existingIndexes.push(...connections);

        if (properties.length === 1) {
            // Not a compound property
            schemaProperties.push(properties[0]);
            continue;
        }

        schemaProperties.push(`[${properties.join("+")}]`);
    }

    return schemaProperties.join(",");
}