import { CompiledSchema, SchemaParent } from "@agrejus/db-framework-core";
import { AggregateQueryable } from '../AggregateQueryable';
import { ChangeTracker } from "../../change-tracking/ChangeTracker";
import { DataBridge } from "../../data-access/DataBridge";
import { QueryRoot } from "./QueryRoot";

export class QueryableFactory<T extends {}> {

    private schema: CompiledSchema<T>;
    private parent: SchemaParent;

    private constructor(options: {
        schema: CompiledSchema<T>,
        parent: SchemaParent
    }) {
        this.parent = options.parent;
        this.schema = options.schema
    }

    get<R extends AggregateQueryable<T>>(Instance: new (schema: CompiledSchema<T>, parent: SchemaParent, options: { queryable?: QueryRoot<T>, dataBridge?: DataBridge<T>, changeTracker?: ChangeTracker<T> }) => R, options: { queryable?: QueryRoot<T>, dataBridge?: DataBridge<T>, changeTracker?: ChangeTracker<T> }) {
        return new Instance(this.schema, this.parent, options)
    }

    static create<T extends {}>(options: {
        schema: CompiledSchema<T>,
        parent: SchemaParent
    }) {
        return new QueryableFactory<T>(options);
    }
}