import { SchemaTypes } from "..";
import { SchemaBase } from "./Base";
import { SchemaNullable } from "./Nullable";
import { SchemaOptional } from "./Optional";

export class SchemaObject<T extends {}> extends SchemaBase<T> {

    instance: T;
    type = SchemaTypes.Object;

    constructor(schema: T) {
        super();
        this.instance = schema;
    }

    optional() {
        const result = new SchemaOptional<typeof this.instance>();
        result.type = this.type;
        result.isOptional = true;
        result.isNullable = this.isNullable;
        result.instance = this.instance;
        return result;
    }

    nullable() {
        const result = new SchemaNullable<typeof this.instance | null>();
        result.type = this.type;
        result.isOptional = this.isOptional;
        result.isNullable = true;
        result.instance = this.instance;
        return result;
    }
}