import { CompiledSchema, IDbPlugin, IdType, NonNullCreateEntity, NonNullEntity, Query } from "@agrejus/db-framework-core";
import { ChangeTrackedEntity, EntityCallbackMany, SaveChangesContextStepFive, SaveChangesContextStepFour, SaveChangesContextStepOne, SaveChangesContextStepSix, SaveChangesContextStepThree, SaveChangesContextStepTwo } from "../../types";
import { DataAccessManager } from "../../data-access/DataAccessManager";
import { UniDirectionalSubscription } from '../../subscriptions/UniDirectionalSubscription';
import { FetchOptions } from "../../data-access/types";
import { ChangeTrackingType } from "@agrejus/db-framework-core/dist/schema";
import { TrampolinePipeline } from "../../DataContextPipeline";

export abstract class ChangeTrackingBase<TKey extends IdType, TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> {

    protected removals: NonNullEntity<TEntity>[] = [];
    protected attachments: Map<TKey, NonNullEntity<TEntity>> = new Map<TKey, NonNullEntity<TEntity>>();
    protected schema: CompiledSchema<TEntity>;
    protected abstract additionsCount: number;
    protected manager: DataAccessManager<TEntity>;
    protected unidirecitonalSubscription: UniDirectionalSubscription;
    readonly changeTrackingType: ChangeTrackingType;
    private readonly _abortController: AbortController;
    protected abstract prepareAdditions(data: SaveChangesContextStepTwo, done: (result: SaveChangesContextStepThree<TEntity>) => void): void;

    constructor(
        schema: CompiledSchema<TEntity>, 
        dbPlugin: IDbPlugin, 
        changeTrackingType: ChangeTrackingType, 
        pipeline: TrampolinePipeline<SaveChangesContextStepOne>,
        abortController: AbortController
    ) {
        this.schema = schema;
        this.manager = new DataAccessManager<TEntity>(schema, dbPlugin, this);
        this._abortController = abortController;
        this.unidirecitonalSubscription = new UniDirectionalSubscription(schema.key, this._abortController);
        this.changeTrackingType = changeTrackingType;

        pipeline.add(this.checkForChangesStep.bind(this))
            .add(this.prepareAdditions.bind(this))
            .add(this.prepareRemovals.bind(this))
            .add(this.prepareUpdates.bind(this))
            .add(this.persist.bind(this))
            .add(this.postOpAdds.bind(this))
            .add(this.postOpUpdates.bind(this))
            .add(this.notifySubscribers.bind(this))
            .add(this.cleanup.bind(this))
    }

    protected cleanup(data: SaveChangesContextStepSix<TEntity>, done: (result: SaveChangesContextStepOne, error?: any) => void) {

        this.clearAdditions();

        if (data.result == null) {
            done({ count: data.count });
            return;
        }

        data.count += data.result.adds.length + data.result.removedCount + data.result.updates.length;

        done({ count: data.count });
    }

    protected checkForChangesStep(data: SaveChangesContextStepOne, done: (result: SaveChangesContextStepTwo) => void) {

        const hasChanges = this.hasChanges();

        // only carry data.count over
        done({
            count: data.count,
            hasChanges
        });
    }

    protected notifySubscribers(data: SaveChangesContextStepSix<TEntity>, done: (result: SaveChangesContextStepSix<TEntity>) => void) {

        if (data.hasChanges === true) {
            this.unidirecitonalSubscription.send();
        }

        done(data);
    }

    protected prepareRemovals(data: SaveChangesContextStepThree<TEntity>, done: (result: SaveChangesContextStepFour<TEntity>) => void) {

        if (data.hasChanges === false) {
            done({ ...data, removes: [] });
            return;
        }

        const removes = this.removals.map(w => this.schema.prepare(w as any) as any);

        done({ ...data, removes });
    }

    protected prepareUpdates(data: SaveChangesContextStepFour<TEntity>, done: (result: SaveChangesContextStepFive<TEntity>) => void) {

        if (data.hasChanges === false) {
            done({ ...data, updates: new Map() });
            return;
        }

        const updates = this.getAttachmentsChanges();

        done({ ...data, updates });
    }

    protected postOpAdds(data: SaveChangesContextStepSix<TEntity>, done: (result: SaveChangesContextStepSix<TEntity>, error?: any) => void) {

        if (data.result == null) {
            done(data)
            return;
        }

        const { adds } = data.result;
        // need to merge adds with data sent in
        adds.forEach(add => {
            const found = data.find(add as any);

            // Let's only map Ids and identities
            this.schema.merge(found as any, add as any); // merge needs to map children appropriately

            const id = this.schema.getId(add as any) as TKey;

            // Set here, if we never save we should never attach
            this.setAttachment(id, found as any)
        });

        done(data);
    }

    protected postOpUpdates(data: SaveChangesContextStepSix<TEntity>, done: (result: SaveChangesContextStepSix<TEntity>, error?: any) => void) {

        if (data.result == null) {
            done(data)
            return;
        }

        const { updates } = data.result;

        updates.forEach(update => {
            const id = this.schema.getId(update as any) as TKey;
            const found = this.attachments.get(id);

            // Let's only map Ids and identities
            this.schema.merge(found as any, update as any); // merge needs to map children appropriately
        });

        done(data);
    }

    protected persist(data: SaveChangesContextStepFive<TEntity>, done: (result: SaveChangesContextStepSix<TEntity>, error?: any) => void) {

        if (data.hasChanges === false) {
            done({ ...data, result: null });
            return;
        }

        this.manager.bulkOperations(this.schema, {
            // prepare is responsible for creating a new clean object 
            // with only properties that should be saved and run any serializers
            adds: this.getPreparedAdditions(),
            removes: this.removals.map(w => this.schema.prepare(w as any) as any),
            updates: this.getAttachmentsChanges()
        }, (result, error) => done({ ...data, result }, error));
    }

    protected abstract setAddition(enriched: NonNullCreateEntity<TEntity>): void;
    protected abstract replaceAddition(existingEntity: NonNullCreateEntity<TEntity>, newEntity: NonNullCreateEntity<TEntity>): boolean;
    protected abstract getPreparedAdditions(): NonNullCreateEntity<TEntity>[];
    protected abstract clearAdditions(): void;

    protected forEachAttachment(callback: (entity: NonNullEntity<TEntity>) => boolean) {
        for (const [, doc] of this.attachments) {
            if (callback(doc) === false) {
                break; // stop
            }
        }
    }

    protected hasAttachmentsChanges() {

        let hasChanges = false;

        this.forEachAttachment(doc => {

            const changeTrackedDoc: ChangeTrackedEntity<{}> = doc as any;

            if (changeTrackedDoc.__tracking__?.isDirty === true) {
                hasChanges = true;
                return false; // stop loop
            }

            return true; // keep going
        })

        return hasChanges;
    }

    protected getAttachmentsChanges() {
        const result = new Map<IdType, { doc: NonNullEntity<TEntity>, delta: { [key: string]: string | number | Date } }>();

        this.forEachAttachment(doc => {

            const changeTrackedDoc: ChangeTrackedEntity<{}> = doc as any;

            if (!changeTrackedDoc.__tracking__?.isDirty) {
                return true; // continue
            }

            const id = this.schema.getId(doc);
            result.set(id, { doc: this.schema.prepare(doc as any) as any, delta: changeTrackedDoc.__tracking__.changes });

            return true; // continue
        })

        return result;
    }

    protected getAttachment(key: TKey) {
        return this.attachments.get(key);
    }

    protected setAttachment(key: TKey, entity: NonNullEntity<TEntity>): void {
        this.attachments.set(key, entity);
    }

    hasChanges() {
        return this.additionsCount > 0 || this.removals.length > 0 || this.hasAttachmentsChanges() === true;
    }

    resolve(entities: NonNullEntity<TEntity>[], options?: FetchOptions) {

        const result = entities.map(entity => {

            const key = this.schema.getId(entity) as TKey;
            const existing = this.getAttachment(key);

            if (existing != null) {
                console.log({ existing, entity });
                if (options?.mergeResponse === true) {
                    this.schema.merge(existing, entity); // merge needs to map children appropriately
                }

                return existing
            }

            this.setAttachment(key, entity);
            return entity
        });

        return result;
    }

    remove(entities: NonNullEntity<TEntity>[], done: EntityCallbackMany<TEntity>) {
        this.removals.push(...entities);
        done(entities);
    }

    replace(existingEntity: NonNullEntity<TEntity> | NonNullCreateEntity<TEntity>, newEntity: NonNullEntity<TEntity> | NonNullCreateEntity<TEntity>) {
        for (const [key, document] of this.attachments) {

            if (document === existingEntity) {
                this.attachments.set(key, newEntity as NonNullEntity<TEntity>);
                return;
            }
        }

        if (this.replaceAddition(existingEntity as NonNullCreateEntity<TEntity>, newEntity as NonNullCreateEntity<TEntity>) === false) {
            throw new Error("Could not find entity to mutate, please ensure a reference to the existing object is passed in to .mutate")
        }
    }

    add(entities: NonNullCreateEntity<TEntity, TEnhancedPropertyNames | TComputedPropertyNames>[], done: EntityCallbackMany<TEntity>) {

        try {

            const result = entities.map(entity => {
                const enriched: NonNullCreateEntity<TEntity> = this.schema.enrich(entity as any, this.changeTrackingType) as any;

                this.setAddition(enriched);

                // result.push(enriched as any);

                return enriched as NonNullEntity<TEntity>;
            });

            done(result);
        } catch (e: any) {
            done([], e);
        }
    }

    subscribe<U>(query: Query<TEntity>, shape: (data: TEntity[]) => U, done: (result: U, error?: any) => void) {
        const subscription = new UniDirectionalSubscription(this.schema.key, this._abortController);
        subscription.onMessage(() => {
            this.manager.fetch(query, (r, e) => {
                const shapedData = shape(r);
                done(shapedData, e);
            }, { mergeResponse: true })
        });

        return () => subscription[Symbol.dispose]();
    };
}   