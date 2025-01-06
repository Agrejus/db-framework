import { CompiledSchema, createUUID, HashType, IDbPlugin, IdType, NonNullCreateEntity, NonNullEntity } from "@agrejus/db-framework-core";
import { ChangeTrackedEntity, EntityCallbackMany, Filter } from "../../types";
import { ChangeSubscription } from "../types";

export abstract class ChangeTrackingBase<TKey extends IdType, TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> {

    protected removals: NonNullEntity<TEntity>[] = [];
    protected attachments: Map<TKey, NonNullEntity<TEntity>> = new Map<TKey, NonNullEntity<TEntity>>();
    protected subscriptions: ChangeSubscription<TEntity>[] = [];
    protected schema: CompiledSchema<TEntity>;
    private readonly _dbPlugin: IDbPlugin;
    protected abstract additionsCount: number;

    constructor(schema: CompiledSchema<TEntity>, dbPlugin: IDbPlugin) {
        this.schema = schema;
        this._dbPlugin = dbPlugin;
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

    subscribe(onChange: (entities: NonNullEntity<TEntity>[]) => void): () => void;
    subscribe(selector: Filter<NonNullEntity<TEntity>>, onChange: (entities: NonNullEntity<TEntity>[]) => void): () => void;
    subscribe(selectorOrOnChange: Filter<NonNullEntity<TEntity>> | ((entities: NonNullEntity<TEntity>[]) => void), onChange?: (entities: NonNullEntity<TEntity>[]) => void) {

        const id = createUUID();

        const unsubscribe = () => {
            const index = this.subscriptions.findIndex(w => w.id === id);
            this.subscriptions.splice(index, 1);
        };

        if (onChange == null) {
            // no selector
            this.subscriptions.push({
                id,
                onChange: selectorOrOnChange as (entities: NonNullEntity<TEntity>[]) => void
            });

            return unsubscribe;
        }

        this.subscriptions.push({
            id,
            onChange: onChange,
            selector: selectorOrOnChange as Filter<NonNullEntity<TEntity>>
        });

        return unsubscribe;
    }

    hasChanges() {
        return this.additionsCount > 0 || this.removals.length > 0 || this.hasAttachmentsChanges() === true;
    }

    resolve(entities: NonNullEntity<TEntity>[]) {
        const result: NonNullEntity<TEntity>[] = [];
        for (let i = 0; i < entities.length; i++) {

            const entity = entities[i];
            const key = this.getId(entity) as TKey;
            const existing = this.getAttachment(key);

            if (existing != null) {
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

    protected bulkOperations(findAddition: (entity: NonNullEntity<TEntity>) => NonNullCreateEntity<TEntity> | undefined, done: (result: number, error?: any) => void) {

        if (this.hasChanges() === false) {
            done(0, null);
            return;
        }

        this._dbPlugin.bulkOperations<any>(this.schema, {
            // prepare is responsible for creating a new clean object 
            // with only properties that should be saved and run any serializers
            adds: this.getPreparedAdditions(),
            removes: this.removals.map(w => this.schema.prepare(w as any)),
            updates: this.getAttachmentsChanges()
        }, ({ adds, removedCount, updates }, error) => {

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

            for (let i = 0; i < this.subscriptions.length; i++) {
                const subscription = this.subscriptions[i];
                const changes = [...(adds as any), ...updates];

                if (subscription.selector == null) {
                    subscription.onChange(changes);
                    continue;
                }

                const filteredChanges = changes.filter(w => subscription.selector(w));

                if (filteredChanges.length > 0) {
                    subscription.onChange(filteredChanges);
                }
            }

            this.clearAdditions();

            done(adds.length + removedCount + updates.length, error);
        });
    }
}   