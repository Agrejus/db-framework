import { CompiledSchema, EntityModificationResult, IdType, NonNullCreateEntity, NonNullEntity } from "@agrejus/db-framework-core";
import { ChangeTrackedEntity, EntityCallbackMany } from "../../types";
import { FetchOptions } from "../../data-access/types";
import { ChangeTrackingType } from "@agrejus/db-framework-core/dist/schema";
import { AdditionsPackage } from "../types";

export abstract class KeyChangeTrackingStrategyBase<TKey extends IdType, TEntity extends {}> {

    protected removals: NonNullEntity<TEntity>[] = [];
    protected attachments: Map<TKey, NonNullEntity<TEntity>> = new Map<TKey, NonNullEntity<TEntity>>();
    protected schema: CompiledSchema<TEntity>;
    protected abstract setAddition(enriched: NonNullCreateEntity<TEntity>): void;

    constructor(
        schema: CompiledSchema<TEntity>,
    ) {
        this.schema = schema;
    }

    protected hasAttachmentsChanges() {

        let hasChanges = false;

        for (const [, doc] of this.attachments) {

            const changeTrackedDoc: ChangeTrackedEntity<{}> = doc as any;

            if (changeTrackedDoc.__tracking__?.isDirty === true) {
                hasChanges = true;
                break
            }
        }

        return hasChanges;
    }

    mergeChanges(changes: EntityModificationResult<TEntity>, addPackge: AdditionsPackage<TEntity>) {

        const { updates, adds } = changes;

        updates.forEach(update => {
            const id = this.schema.getId(update as any) as TKey;
            const found = this.attachments.get(id);

            // Let's only map Ids and identities
            this.schema.merge(found as any, update as any); // merge needs to map children appropriately
        });

        adds.forEach(add => {
            const found = addPackge.find(add as any);

            // Let's only map Ids and identities
            this.schema.merge(found as any, add as any); // merge needs to map children appropriately

            const id = this.schema.getId(add as any) as TKey;

            // Set here, if we never save we should never attach
            this.attachments.set(id, found as any)
        });
    }

    prepareRemovals() {
        const result: NonNullEntity<TEntity>[] = [];
        for (let i = 0, length = this.removals.length; i < length; i++) {
            result.push(this.schema.prepare(this.removals[i] as any) as any);
        }
        return result;
    }

    getAttachmentsChanges() {
        const result = new Map<IdType, { doc: NonNullEntity<TEntity>, delta: { [key: string]: string | number | Date } }>();

        for (const [, doc] of this.attachments) {
            const changeTrackedDoc: ChangeTrackedEntity<{}> = doc as any;

            if (!changeTrackedDoc.__tracking__?.isDirty) {
                continue;
            }

            const id = this.schema.getId(doc);
            result.set(id, { doc: this.schema.prepare(doc as any) as any, delta: changeTrackedDoc.__tracking__.changes });
        }

        return result;
    }

    // Checks to see if the item is already attached, if so we merge, if not we attach and return each result
    resolve(entities: NonNullEntity<TEntity>[], options?: FetchOptions) {

        const result: NonNullEntity<TEntity>[] = [];
        for (let i = 0, length = entities.length; i < length; ++i) {
            const entity = entities[i];
            const key = this.schema.getId(entity) as TKey;
            const existing = this.attachments.get(key);

            if (existing != null) {
                if (options?.mergeResponse === true) {
                    this.schema.merge(existing, entity); // merge needs to map children appropriately
                }

                result.push(existing);
                continue;
            }

            this.attachments.set(key, entity);
            result.push(entity);
        }

        return result;
    }

    remove(entities: NonNullEntity<TEntity>[], done: EntityCallbackMany<TEntity>) {
        this.removals.push(...entities);
        done(entities);
    }

    replaceAttachment(existingEntity: NonNullEntity<TEntity> | NonNullCreateEntity<TEntity>, newEntity: NonNullEntity<TEntity> | NonNullCreateEntity<TEntity>) {
        for (const [key, document] of this.attachments) {

            if (document === existingEntity) {
                this.attachments.set(key, newEntity as NonNullEntity<TEntity>);
                return;
            }
        }
    }

    protected _add(entities: NonNullCreateEntity<TEntity>[], changeTrackingType: ChangeTrackingType, done: EntityCallbackMany<TEntity>) {

        try {

            const result: NonNullEntity<TEntity>[] = [];

            for (let i = 0, length = entities.length; i < length; ++i) {
                const entity = entities[i];
                const enriched: NonNullCreateEntity<TEntity> = this.schema.enrich(entity as any, changeTrackingType) as any;

                this.setAddition(enriched);

                result.push(enriched as NonNullEntity<TEntity>);
            }

            done(result);
        } catch (e: any) {
            done([], e);
        }
    }

    enrich(entities: NonNullEntity<TEntity>[]) {
        const result = [];

        for (let i = 0, length = entities.length; i < length; i++) {
            result.push(this.schema.enrich(entities[i], "entity"));
        }

        return result;
    }
}   