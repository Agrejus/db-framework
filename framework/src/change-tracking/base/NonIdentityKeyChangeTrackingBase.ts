import { IdType, NonNullCreateEntity } from "@agrejus/db-framework-core";
import { ChangeTrackingBase } from "./ChangeTrackingBase";
import { IChangeTracker } from '../types';
import { SaveChangesContextStepThree, SaveChangesContextStepTwo } from "../../types";

export class NonIdentityKeyChangeTrackingBase<TKey extends IdType, TEntity extends {}>
    extends ChangeTrackingBase<TKey, TEntity> implements IChangeTracker<TEntity> {

    protected additions: Map<TKey, NonNullCreateEntity<TEntity>> = new Map<TKey, NonNullCreateEntity<TEntity>>();

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

    protected override replaceAddition(existingEntity: NonNullCreateEntity<TEntity>, newEntity: NonNullCreateEntity<TEntity>): boolean {
        for (const [key, document] of this.additions) {

            if (document === existingEntity) {
                this.additions.set(key, newEntity);
                return true;
            }
        }

        return false;
    }

    protected prepareAdditions(data: SaveChangesContextStepTwo, done: (result: SaveChangesContextStepThree<TEntity>) => void) {

        if (data.hasChanges === false) {
            done({ ...data, adds: [], find: () => undefined as any });
            return;
        }

        const adds = this.getPreparedAdditions();

        done({
            ...data,
            adds,
            find: entity => {
                const id = this.schema.getId(entity) as TKey;
                return this.additions.get(id)
            }
        });
    }
}