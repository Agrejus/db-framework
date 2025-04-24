import { HashType, IdType, InferCreateType, InferType, toMap } from "@agrejus/db-framework-core";
import { KeyChangeTrackingStrategyBase } from "./KeyChangeTrackingStrategyBase";
import { AdditionsPackage, IChangeTrackerStrategy } from "../types";
import { EntityCallbackMany } from "../../types";

export class IdentityKeyChangeTrackingStrategy<TKey extends IdType, TEntity extends {}>
    extends KeyChangeTrackingStrategyBase<TKey, TEntity> implements IChangeTrackerStrategy<TEntity> {

    protected additions: InferCreateType<TEntity>[] = [];

    protected setAddition(item: InferCreateType<TEntity>) {
        this.additions.push(item);
    }

    replace(existingEntity: InferType<TEntity> | InferCreateType<TEntity>, newEntity: InferType<TEntity> | InferCreateType<TEntity>) {
        super.replaceAttachment(existingEntity, newEntity);

        this._replaceAddition(existingEntity, newEntity);
    }

    private _replaceAddition(existingEntity: InferType<TEntity> | InferCreateType<TEntity>, newEntity: InferType<TEntity> | InferCreateType<TEntity>) {
        const index = this.additions.findIndex(x => x === existingEntity);

        if (index === -1) {
            throw new Error("Could not find entity to mutate, please ensure a reference to the existing object is passed in to .mutate")
        }

        this.additions[index] = newEntity as InferCreateType<TEntity>;
    }

    hasChanges(): boolean {
        return this.additions.length > 0 || this.removals.length > 0 || this.hasAttachmentsChanges() === true;
    }

    add(entities: InferCreateType<TEntity>[], done: EntityCallbackMany<TEntity>): void {
        super._add(entities, "entity", done);
    }

    prepareAdditions(): AdditionsPackage<TEntity> {

        if (this.additions.length === 0) {
            return {
                adds: [],
                find: () => undefined as any
            }
        }

        const adds = this.additions.map(w => this.schema.prepare(w as any))
        const hashedAdds = toMap(this.additions, w => this.schema.hash(w, HashType.Object));

        return {
            adds,
            find: entity => {
                const hash = this.schema.hash(entity as any, HashType.Object);
                return hashedAdds.get(hash);
            }
        }
    }

    clearAdditions() {
        this.additions = [];
    }
}