import { SchemaTypes } from "..";
import { SchemaBase } from "./Base";
import { SchemaNullable } from "./Nullable";
import { SchemaOptional } from "./Optional";

export class SchemaString<T extends string = string> extends SchemaBase<T> {

    instance: T;
    type = SchemaTypes.String;

    constructor(options?: { isId?: boolean, isAutoGenerated?: boolean }) {
        super();
        this.isId = options?.isId ?? false;
        this.isAutoGenerated = options?.isAutoGenerated ?? false;
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
