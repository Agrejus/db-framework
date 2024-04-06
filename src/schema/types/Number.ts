import { SchemaTypes } from "..";
import { SchemaBase } from "./Base";
import { SchemaNullable } from "./Nullable";
import { SchemaOptional } from "./Optional";

export class SchemaNumber<T extends number = number> extends SchemaBase<T> {

    instance: T;
    type = SchemaTypes.Number;

    constructor(options?: { isId: boolean }) {
        super();
        this.isId = options?.isId ?? false;
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