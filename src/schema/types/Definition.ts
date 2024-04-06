import { InferType, SchemaTypes } from "..";
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
}