import { SchemaBase } from "./Base";
import { SchemaNullable } from "./Nullable";

export class SchemaOptional<T extends any> extends SchemaBase<T> {

    instance?: T;

    constructor() {
        super();
        this.isOptional = true;
    }

    nullable() {
        const result = new SchemaNullable<typeof this.instance | null>();
        result.isNullable = true;
        result.isOptional = this.isOptional;
        result.name = this.name;
        return result;
    }
}
