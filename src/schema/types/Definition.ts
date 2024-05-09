import { ExpandedChildProperty, ExpandedProperty, ExpandedSchema, SchemaTypes } from "..";
import { SchemaBase } from "./Base";

export class SchemaDefinition<TDocumentType extends string, T extends {}> extends SchemaBase<T> {

    instance: T;
    type = SchemaTypes.Definition;
    documentType: TDocumentType;

    constructor(documentType: TDocumentType, schema: T) {
        super();
        this.instance = schema;
        this.isNullable = false;
        this.isOptional = false;
        this.documentType = documentType;
    }

    private _joinPaths(path: string, key: string, delimiter: string) {

        if (path == "") {
            return key;
        }

        return path + delimiter + key;
    }

    expand(): ExpandedSchema {

        const schema = this;
        const properties: ExpandedProperty[] = [];
        const explore: { schema: SchemaBase<any>, selectorPath: string, assignmentPath: string, isNullableOrOptional: boolean, isAutoGenerated: boolean }[] = [{ 
            schema, 
            selectorPath: "", 
            assignmentPath: "", 
            isNullableOrOptional: false,
            isAutoGenerated: false
        }];
        let idPropertyName: string = "";
        let autoGeneratedSetter = (entity: any, _: any) => entity;

        for (let i = 0; i < explore.length; i++) {
            const item = explore[i];

            for (const key in item.schema.instance) {
                const property = item.schema.instance[key] as SchemaBase<any>;
                const selectorPath = this._joinPaths(item.selectorPath, key, item.isNullableOrOptional ? "?." : ".");
                const assignmentPath = this._joinPaths(item.assignmentPath, key, ".");
                const isNullableOrOptional = item.isNullableOrOptional || property.isOptional || property.isNullable;
                const isAutoGenerated = property.isAutoGenerated;
                const type = property.type;
                const propertyName = key;

                if (property.isId === true) {
                    idPropertyName = key;
                }

                if (property.type === SchemaTypes.Object) {
                    const childProperties = new Map<string, ExpandedChildProperty>(Object.keys(property.instance).map(w => [w, {
                        isNullableOrOptional: property.instance[w].isOptional || property.instance[w].isNullable,
                        type: property.instance[w].type,
                        propertyName: w,
                        isAutoGenerated: property.instance[w].isAutoGenerated
                    }]));
                    explore.push({ schema: property, selectorPath, assignmentPath, isNullableOrOptional, isAutoGenerated });
                    properties.push({ selectorPath, assignmentPath, type, isNullableOrOptional, propertyName, properties: childProperties, childDegree: i, isAutoGenerated });
                    continue;
                }

                properties.push({ selectorPath, assignmentPath, type, isNullableOrOptional, propertyName, properties: new Map<string, ExpandedProperty>(), childDegree: i, isAutoGenerated });
            }
        }

        const autoGeneratedProperties = properties.filter(w => w.isAutoGenerated === true).map(w => w.propertyName);

        if (autoGeneratedProperties.length > 0) {
            autoGeneratedSetter = Function("entity", "dbrecord", `return {...entity, ${autoGeneratedProperties.map(w => `${w}: dbrecord["${w}"]`).join(",")} }`) as (entity: any, dbrecord: any) => any;
        }

        return {
            properties: new Map(properties.map(w => [w.selectorPath, w])),
            idPropertyName,
            autoGeneratedSetter
        }
    }
}