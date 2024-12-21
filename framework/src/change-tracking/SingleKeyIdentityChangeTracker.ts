import { IDbPlugin, NonNullCreateEntity, NonNullEntity, CompiledSchema, toMap } from "@agrejus/db-framework-core";
import { ChangeTrackedEntity, EntityCallbackMany } from "../types";
import { IChangeTracker } from "./types";
import { HashType } from "@agrejus/db-framework-core/dist/schema";
import { IdType } from "@agrejus/db-framework-core/src";

export class SingleIdentityKeyChangeTracker<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> implements IChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames> {

    protected removals: NonNullEntity<TEntity>[] = [];
    protected additions: NonNullCreateEntity<TEntity>[] = [];
    protected attachments: Map<IdType, NonNullEntity<TEntity>> = new Map<IdType, NonNullEntity<TEntity>>();
    private _schema: CompiledSchema<TEntity>;
    private readonly _dbPlugin: IDbPlugin;

    constructor(schema: CompiledSchema<TEntity>, dbPlugin: IDbPlugin) {
        this._schema = schema;
        this._dbPlugin = dbPlugin;
    }

    private _hasAttachmentsChanges() {
        for(const [,doc] of this.attachments) {
            const changeTrackedDoc: ChangeTrackedEntity<{}> = doc as any;

            if (changeTrackedDoc.__tracking__?.isDirty === true) {
                return true;
            }
        }

        return false;
    }
    
    hasChanges() {
        return this.additions.length > 0 || this.removals.length > 0 || this._hasAttachmentsChanges() === true;
    }

    resolve(entities: NonNullEntity<TEntity>[]) {

        const result: NonNullEntity<TEntity>[] = [];

        for(let i = 0; i < entities.length; i++) {
            
            const entity = entities[i];
            const key = this._schema.getIds(entity)[0];
            const existing = this.attachments.get(key);

            if (existing != null) {
                result.push(existing);
                continue;
            }

            this.attachments.set(key, entity);
            result.push(entity);         
        }

        return result;
    }

    private _getAttachmentsChanges() {
        const result = new Map<IdType, { doc: NonNullEntity<TEntity>, delta: { [key: string]: string | number | Date } }>();
        for (const [, doc] of this.attachments) {
            const changeTrackedDoc: ChangeTrackedEntity<{}> = doc as any;

            if (!changeTrackedDoc.__tracking__?.isDirty) {
                continue;
            }

            const id = this._schema.getIds(doc)[0];
            result.set(id, { doc: this._schema.prepare(doc as any) as any, delta: changeTrackedDoc.__tracking__.changes })
        }

        return result;
    }

    saveChanges(done: (result: number, error?: any) => void) {

        if (this.hasChanges() === false) {
            done(0, null);
            return;
        }

        const preparedAdds = this.additions.map(w => this._schema.prepare(w));

        // need to hash here, not on add in case something is changed after adding
        const hashedAdds = toMap(this.additions, w => this._schema.hash(w, HashType.Object));

        this._dbPlugin.bulkOperations<any>(this._schema, {
            // prepare is responsible for creating a new clean object 
            // with only properties that should be saved and run any serializers
            adds: preparedAdds,
            removes: this.removals.map(w => this._schema.prepare(w as any)),
            updates: this._getAttachmentsChanges()
        }, ({ adds, removedCount, updates }, error) => {

            // need to merge adds with data sent in
            for (let i = 0; i < adds.length; i++) {
                const add = adds[i];
                const hash = this._schema.hash(add as any, HashType.Object);
                const found = hashedAdds.get(hash);

                // Let's only map Ids and identities
                this._schema.merge(found as any, add as any);

                const id = this._schema.getIds(found as any)[0];
                // Set here, if we never save we should never attach
                this.attachments.set(id, found as any);
            }

            this.additions = [];

            done(adds.length + removedCount + updates.length, error);
        });
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

                const enriched: NonNullCreateEntity<TEntity> = this._schema.enrich(entity as any) as any;

                this.additions.push(enriched);

                result.push(enriched as any);
            }

            done(result);
        } catch (e: any) {
            done([], e);
        }
    }
}