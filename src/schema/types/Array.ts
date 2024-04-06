import { SchemaTypes } from "..";
import { SchemaBase } from "./Base";
import { SchemaNullable } from "./Nullable";
import { SchemaOptional } from "./Optional";

export class SchemaArray<T extends any> extends SchemaBase<T[]> {
    
    instance: T[];
    type = SchemaTypes.Array;

    constructor(schema?: T) {
        super();
    }

    optional() {
        const result = new SchemaOptional<typeof this.instance>();
        result.type = this.type;
        return result;
    }

    nullable() {
        const result = new SchemaNullable<typeof this.instance | null>();
        result.type = this.type;
        return result;
    }
}
