import { IdType, NonNullCreateEntity, CompiledSchema, IDbPlugin, HashType } from "@agrejus/db-framework-core";
import { ChangeTrackingBase } from "./ChangeTrackingBase";
import { IChangeTracker } from '../types';

export class NonIdentityKeyChangeTrackingBase<TKey extends IdType, TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never>
    extends ChangeTrackingBase<TKey, TEntity, TEnhancedPropertyNames, TComputedPropertyNames> implements IChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames> {

    protected additions: Map<TKey, NonNullCreateEntity<TEntity>> = new Map<TKey, NonNullCreateEntity<TEntity>>();

    constructor(schema: CompiledSchema<TEntity>, dbPlugin: IDbPlugin) {
        super(schema, dbPlugin);
    }

    protected override get additionsCount() {
        return this.additions.size;
    }

    protected override setAddition(enriched: NonNullCreateEntity<TEntity>) {
        const id = this.schema.getId(enriched as any) as TKey;
        this.additions.set(id, enriched as any);
    }

    protected override getPreparedAdditions() {
        return [...this.additions.values()].map(w => this.schema.prepare(w as any))
    }

    protected override clearAdditions() {
        this.additions = new Map();
    }

    override saveChanges(done: (result: number, error?: any) => void) {
        this.bulkOperations(entity => {
            const id = this.schema.getId(entity) as TKey;
            return  this.additions.get(id)
        }, done);
    }
}