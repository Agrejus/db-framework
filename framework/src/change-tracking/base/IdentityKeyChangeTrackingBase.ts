import { IdType, NonNullCreateEntity, CompiledSchema, IDbPlugin, HashType, toMap } from "@agrejus/db-framework-core";
import { ChangeTrackingBase } from "./ChangeTrackingBase";
import { IChangeTracker } from '../types';
import { ChangeTrackingType } from "@agrejus/db-framework-core/dist/schema";

export class IdentityKeyChangeTrackingBase<TKey extends IdType, TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never>
    extends ChangeTrackingBase<TKey, TEntity, TEnhancedPropertyNames, TComputedPropertyNames> implements IChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames> {

    protected additions: NonNullCreateEntity<TEntity>[] = [];

    constructor(schema: CompiledSchema<TEntity>, dbPlugin: IDbPlugin, changeTrackingType: ChangeTrackingType) {
        super(schema, dbPlugin, changeTrackingType);
    }

    protected override get additionsCount() {
        return this.additions.length;
    }

    protected override  setAddition(enriched: NonNullCreateEntity<TEntity>): void {
        this.additions.push(enriched);
    }

    protected override getPreparedAdditions() {
        return this.additions.map(w => this.schema.prepare(w as any))
    }

    protected override clearAdditions() {
        this.additions = [];
    }

    protected override replaceAddition(existingEntity: NonNullCreateEntity<TEntity>, newEntity: NonNullCreateEntity<TEntity>) : boolean {
        const index = this.additions.findIndex(x => x === existingEntity);

        if (index === -1) {
            return false;
        }

        this.additions[index] = newEntity;

        return true;
    }

    override saveChanges(done: (result: number, error?: any) => void): void {
        const hashedAdds = toMap(this.additions, w => this.schema.hash(w, HashType.Object));

        this.bulkOperations(entity => {
            const hash = this.schema.hash(entity as any, HashType.Object);
            return hashedAdds.get(hash);
        }, done)
    }
}