import { CompiledSchema, EntityModificationResult, HashType, IDbPlugin, IdType, NonNullCreateEntity, NonNullEntity, Query } from "@agrejus/db-framework-core";
import { ChangeTrackedEntity, EntityCallbackMany } from "../../types";
import { DataAccessManager } from "../../data-access/DataAccessManager";
import { UniDirectionalSubscription } from '../../subscriptions/UniDirectionalSubscription';
import { PreRequestSubscription } from '../../subscriptions/PreRequestSubscription';
import { FetchOptions } from "../../data-access/types";

export abstract class ChangeTrackingBase<TKey extends IdType, TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> {

    protected removals: NonNullEntity<TEntity>[] = [];
    protected attachments: Map<TKey, NonNullEntity<TEntity>> = new Map<TKey, NonNullEntity<TEntity>>();
    protected schema: CompiledSchema<TEntity>;
    protected abstract additionsCount: number;
    protected manager: DataAccessManager<TEntity>;
    protected unidirecitonalSubscription: UniDirectionalSubscription;

    constructor(schema: CompiledSchema<TEntity>, dbPlugin: IDbPlugin) {
        this.schema = schema;
        this.manager = new DataAccessManager<TEntity>(schema, dbPlugin, this);
        this.unidirecitonalSubscription = new UniDirectionalSubscription(schema.key);
    }

    protected abstract setAddition(enriched: NonNullCreateEntity<TEntity>): void;
    protected abstract getPreparedAdditions(): NonNullCreateEntity<TEntity>[];
    protected abstract clearAdditions(): void;
    abstract saveChanges(done: (result: number, error?: any) => void): void;

    protected forEachAttachment(callback: (entity: NonNullEntity<TEntity>) => boolean) {
        for (const [, doc] of this.attachments) {
            if (callback(doc) === false) {
                break; // stop
            }
        }
    }

    protected getId(entity: NonNullEntity<TEntity>) {
        if (this.schema.idPropertyNames.length > 1) {
            return this.schema.hash(entity, HashType.Ids) as TKey;
        }

        return this.schema.getIds(entity as any)[0] as TKey;
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

            const id = this.getId(doc);
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

        const result: NonNullEntity<TEntity>[] = [];
        for (let i = 0; i < entities.length; i++) {

            const entity = entities[i];
            const key = this.getId(entity) as TKey;
            const existing = this.getAttachment(key);

            if (existing != null) {

                if (options?.mergeResponse === true) {
                    this.schema.merge(existing, entity); // merge needs to map children appropriately
                }

                result.push(existing);
                continue;
            }

            this.setAttachment(key, entity);
            result.push(entity);
        }

        return result;
    }

    remove(entities: NonNullEntity<TEntity>[], done: EntityCallbackMany<TEntity>) {
        this.removals.push(...entities);
        done(entities);
    }

    add(entities: NonNullCreateEntity<TEntity, TEnhancedPropertyNames | TComputedPropertyNames>[], done: EntityCallbackMany<TEntity>) {

        const result: NonNullEntity<TEntity>[] = [];

        try {

            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i];

                const enriched: NonNullCreateEntity<TEntity> = this.schema.enrich(entity as any) as any;

                this.setAddition(enriched);

                result.push(enriched as any);
            }

            done(result);
        } catch (e: any) {
            done([], e);
        }
    }

    subscribe<U>(query: Query<TEntity>, shape: (data: TEntity[]) => U, done: (result: U, error?: any) => void) {
        const subscription = new UniDirectionalSubscription(this.schema.key);
        subscription.onMessage(() => {
            this.manager.fetch(query, (r, e) => {
                const shapedData = shape(r);
                done(shapedData, e);
            }, { mergeResponse: true } )
        });

        return () => subscription[Symbol.dispose]();
    };

    private _resolveBulkOperationsResult(result: EntityModificationResult<TEntity>, findAddition: (entity: NonNullEntity<TEntity>) => NonNullCreateEntity<TEntity> | undefined) : number {
        const { adds, removedCount, updates } = result;
        const response = removedCount + adds.length + updates.length;

        // need to merge adds with data sent in
        for (let i = 0; i < adds.length; i++) {

            const add = adds[i];
            const found = findAddition(add as any);

            // Let's only map Ids and identities
            this.schema.merge(found as any, add as any); // merge needs to map children appropriately

            const id = this.getId(add as any) as TKey;

            // Set here, if we never save we should never attach
            this.setAttachment(id, found as any)
        }

        // need to merge updates in case we have identity properties
        for (let i = 0; i < updates.length; i++) {

            const update = updates[i];

            const id = this.getId(update as any) as TKey;
            const found = this.attachments.get(id);

            // Let's only map Ids and identities
            this.schema.merge(found as any, update as any); // merge needs to map children appropriately
        }

        return response;
    }

    protected bulkOperations(findAddition: (entity: NonNullEntity<TEntity>) => NonNullCreateEntity<TEntity> | undefined, done: (result: number, error?: any) => void) {

        if (this.hasChanges() === false) {
            done(0, null);
            return;
        }

        this.manager.bulkOperations(this.schema, {
            // prepare is responsible for creating a new clean object 
            // with only properties that should be saved and run any serializers
            adds: this.getPreparedAdditions(),
            removes: this.removals.map(w => this.schema.prepare(w as any) as any),
            updates: this.getAttachmentsChanges()
        }, (result, error) => {

            const response = this._resolveBulkOperationsResult(result, findAddition);

            // run subscriptions
            this.unidirecitonalSubscription.send();

            this.clearAdditions();

            done(response, error);
        });
    }
}   