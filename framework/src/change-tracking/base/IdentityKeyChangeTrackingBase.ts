import { IdType, NonNullCreateEntity, HashType, toMap } from "@agrejus/db-framework-core";
import { ChangeTrackingBase } from "./ChangeTrackingBase";
import { IChangeTracker } from '../types';
import { SaveChangesContextStepThree, SaveChangesContextStepTwo } from "../../types";

export class IdentityKeyChangeTrackingBase<TKey extends IdType, TEntity extends {}>
    extends ChangeTrackingBase<TKey, TEntity> implements IChangeTracker<TEntity> {

    protected additions: NonNullCreateEntity<TEntity>[] = [];


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

    protected override replaceAddition(existingEntity: NonNullCreateEntity<TEntity>, newEntity: NonNullCreateEntity<TEntity>): boolean {
        const index = this.additions.findIndex(x => x === existingEntity);

        if (index === -1) {
            return false;
        }

        this.additions[index] = newEntity;

        return true;
    }

    protected prepareAdditions(data: SaveChangesContextStepTwo, done: (result: SaveChangesContextStepThree<TEntity>) => void) {

        if (data.hasChanges === false) {
            done({ ...data, adds: [], find: () => undefined as any });
            return;
        }

        const adds = this.getPreparedAdditions();
        const hashedAdds = toMap(this.additions, w => this.schema.hash(w, HashType.Object));

        done({
            ...data,
            adds,
            find: entity => {
                const hash = this.schema.hash(entity as any, HashType.Object);
                return hashedAdds.get(hash);
            }
        });
    }
}