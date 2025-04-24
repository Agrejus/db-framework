import { IdType, InferCreateType, InferType } from "@agrejus/db-framework-core";
import { KeyChangeTrackingStrategyBase } from "./KeyChangeTrackingStrategyBase";
import { AdditionsPackage, IChangeTrackerStrategy } from "../types";
import { EntityCallbackMany } from "../../types";

export class NonIdentityKeyChangeTrackingStrategy<TKey extends IdType, TEntity extends {}>
    extends KeyChangeTrackingStrategyBase<TKey, TEntity> implements IChangeTrackerStrategy<TEntity> {

    protected additions: Map<TKey, InferCreateType<TEntity>> = new Map<TKey, InferCreateType<TEntity>>();

    protected setAddition(item: InferCreateType<TEntity>) {
        const id = this.schema.getId(item as any) as TKey;
        this.additions.set(id, item as any);
    }

    replace(existingEntity: InferType<TEntity> | InferCreateType<TEntity>, newEntity: InferType<TEntity> | InferCreateType<TEntity>) {
        super.replaceAttachment(existingEntity, newEntity);

        this._replaceAddition(existingEntity, newEntity);
    }

    private _replaceAddition(existingEntity: InferType<TEntity> | InferCreateType<TEntity>, newEntity: InferType<TEntity> | InferCreateType<TEntity>) {
        for (const [key, document] of this.additions) {

            if (document === existingEntity) {
                this.additions.set(key, newEntity as InferCreateType<TEntity>);
                return;
            }
        }

        throw new Error("Could not find entity to mutate, please ensure a reference to the existing object is passed in to .mutate")
    }

    hasChanges(): boolean {
        return this.additions.size > 0 || this.removals.length > 0 || this.hasAttachmentsChanges() === true;
    }

    add(entities: InferCreateType<TEntity>[], done: EntityCallbackMany<TEntity>): void {
        super._add(entities, "entity", done);
    }

    prepareAdditions(): AdditionsPackage<TEntity> {

        if (this.additions.size === 0) {
            return {
                adds: [],
                find: () => undefined as any
            }
        }

        const adds = [...this.additions.values()].map(w => this.schema.prepare(w as any));

        return {
            adds,
            find: entity => {
                const id = this.schema.getId(entity) as TKey;
                return this.additions.get(id)
            }
        }
    }

    clearAdditions() {
        this.additions = new Map();
    }
}