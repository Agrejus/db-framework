import { SchemaTypes } from "..";
import { SchemaBase } from "./Base";
import { SchemaNullable } from "./Nullable";
import { SchemaOptional } from "./Optional";

export class SchemaDate<T extends Date = Date> extends SchemaBase<T> {

    instance: T;
    type = SchemaTypes.Date;

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
