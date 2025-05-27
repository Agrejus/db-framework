import { IdType, CompiledSchema, SchemaTypes, uuidv4, InferType } from "@agrejus/db-framework-core";
import { PropertyInfo } from "@agrejus/db-framework-core/dist/common/PropertyInfo";

export class DbCollection {
    private nextNumericalId: number;
    private readonly data: Map<IdType, Record<string, unknown>>;
    private readonly schema: CompiledSchema<any>;

    get size() {
        return this.data.size;
    }

    get records() {
        return [...this.data.values()];
    }

    constructor(schema: CompiledSchema<any>) {
        this.nextNumericalId = 0;
        this.data = new Map();
        this.schema = schema;
    }

    private _getNextId() {
        return ++this.nextNumericalId;
    }

    private _setId(item: Record<string, unknown>, property: PropertyInfo<any>) {
        if (item[property.name] != null) {
            return;
        }

        if (property.type === SchemaTypes.String) {
            item[property.name] = uuidv4();
            return;
        }

        if (property.type === SchemaTypes.Number) {
            item[property.name] = this._getNextId();
            return;
        }

        throw new Error(`Id Property '${property.name}' must be string or number, found '${property.type}'`)
    }

    seed(items: Record<string, unknown>[]) {
        for (let i = 0, length = items.length; i < length; i++) {
            const id = this.schema.getId(items[i] as InferType<unknown>);
            this.data.set(id, items[i]);
        }
    }

    add(item: Record<string, unknown>) {

        if (this.schema.hasIdentityKeys) {
            const idProperties = this.schema.idProperties;

            if (idProperties.length === 1) {
                this._setId(item, idProperties[0]);
            } else {
                for (let j = 0, l = idProperties.length; j < l; j++) {
                    // TODO: Need to allow multiple keys in a memory set
                    this._setId(item, idProperties[j]);
                }
            }

            const id = this.schema.getId(item as InferType<unknown>);
            this.data.set(id, item);
        }

        const idProperties = this.schema.idProperties;

        // ensure keys
        for (let j = 0, l = idProperties.length; j < l; j++) {
            const property = idProperties[j];

            if (property.getValue(item) == null) {
                throw new Error(`Key cannot be null.  Key: ${property.name}`);
            }
        }

        // add non identity, user generated ids
        const id = this.schema.getId(item as InferType<unknown>);
        this.data.set(id, item);
    }

    remove(item: Record<string, unknown>) {
        const id = this.schema.getId(item);
        this.data.delete(id);
    }

    update(item: Record<string, unknown>) {
        const id = this.schema.getId(item);
        this.data.set(id, item);
    }
}