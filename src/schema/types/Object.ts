import { SchemaTypes } from "..";
import { SchemaBase } from "./Base";
import { SchemaNullable } from "./Nullable";
import { SchemaOptional } from "./Optional";

export class SchemaObject<T extends {}> extends SchemaBase<T> {

    instance: T;
    name = SchemaTypes.Object;

    constructor(schema: T) {
        super();
        this.instance = schema;
    }

    optional() {
        const result = new SchemaOptional<typeof this.instance>();
        result.name = this.name;
        return result;
    }

    nullable() {
        const result = new SchemaNullable<typeof this.instance | null>();
        result.name = this.name;
        return result;
    }
}