import { SchemaBase } from "./Base";
import { SchemaOptional } from "./Optional";

export class SchemaNullable<T extends any> extends SchemaBase<T> {
    instance: T;

    constructor() {
        super();
        this.isNullable = true;
    }

    optional() {
        const result = new SchemaOptional<typeof this.instance>();
        result.isNullable = this.isNullable;
        result.isOptional = true;
        result.name = this.name;
        return result;
    }
}
