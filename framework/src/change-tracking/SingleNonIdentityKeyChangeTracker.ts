import { IDbPlugin, IdType, NonNullCreateEntity, NonNullEntity, CompiledSchema } from "@agrejus/db-framework-core";
import { EntityCallbackMany } from "../types";
import { IChangeTracker } from "./types";

export class SingleNonIdentityKeyChangeTracker<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> implements IChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames> {

    protected removals: Map<IdType, NonNullEntity<TEntity>> = new Map<IdType, NonNullEntity<TEntity>>();
    protected additions: Map<IdType, NonNullCreateEntity<TEntity>> = new Map<IdType, NonNullCreateEntity<TEntity>>();
    protected removeById: Set<IdType> = new Set<IdType>();
    protected attachments: Map<IdType, NonNullEntity<TEntity>> = new Map<IdType, NonNullEntity<TEntity>>();
    private _schema: CompiledSchema<TEntity>;
    private readonly _dbPlugin: IDbPlugin;

    constructor(schema: CompiledSchema<TEntity>, dbPlugin: IDbPlugin) {
        this._schema = schema;
        this._dbPlugin = dbPlugin;
    }

    saveChanges(done: (result: number, error?: any) => void) {

        this._dbPlugin.bulkOperations<any>(this._schema, {
            // prepare is responsible for creating a new clean object 
            // with only properties that should be saved and run any serializers
            adds: [...this.additions.values()].map(w => this._schema.prepare(w)),
            removes: {
                entities: [],
                ids: []
            },
            updates: {
                data: [],
                deltas: new Map()
            }
        }, ({ adds, removedCount, updates }, error) => {

            // need to merge adds with data sent in
            for (let i = 0; i < adds.length; i++) {
                const add = adds[i];
                const id = this._schema.getIds(add as any)[0];
                const found = this.additions.get(id);

                // Let's only map Ids and identities
                this._schema.merge(found as any, add as any);
            }

            done(adds.length + removedCount + updates.length, error);
        });
    }

    add(entities: NonNullCreateEntity<TEntity, TEnhancedPropertyNames | TComputedPropertyNames>[], done: EntityCallbackMany<TEntity>) {

        const result: NonNullEntity<TEntity>[] = [];

        try {

            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i];

                const enriched: NonNullCreateEntity<TEntity> = this._schema.enrich(entity as any) as any;
                const id = this._schema.getIds(enriched as any)[0];

                this.additions.set(id, enriched);

                result.push(enriched as any);
            }

            done(result);
        } catch (e: any) {
            done([], e);
        }
    }
}