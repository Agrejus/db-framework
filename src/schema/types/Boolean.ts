import { SchemaTypes } from "..";
import { SchemaBase } from "./Base";
import { SchemaNullable } from "./Nullable";
import { SchemaOptional } from "./Optional";

export class SchemaBoolean<T extends boolean = boolean> extends SchemaBase<T> {

    instance: T;
    type = SchemaTypes.Boolean;
    
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
