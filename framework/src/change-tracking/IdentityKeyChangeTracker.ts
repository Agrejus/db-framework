import { IDbPlugin, IdType, NonNullCreateEntity, NonNullEntity, CompiledSchema, toMap } from "@agrejus/db-framework-core";
import { EntityCallbackMany } from "../types";
import { IChangeTracker } from "./types";
import { HashType } from "@agrejus/db-framework-core/dist/schema";

export class IdentityKeyChangeTracker<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> implements IChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames> {

    protected removals: Map<IdType, NonNullEntity<TEntity>> = new Map<IdType, NonNullEntity<TEntity>>();
    protected additions: NonNullCreateEntity<TEntity>[] = [];
    protected removeById: Set<IdType> = new Set<IdType>();
    protected attachments: Map<IdType, NonNullEntity<TEntity>> = new Map<IdType, NonNullEntity<TEntity>>();
    private _schema: CompiledSchema<TEntity>;
    private readonly _dbPlugin: IDbPlugin;

    constructor(schema: CompiledSchema<TEntity>, dbPlugin: IDbPlugin) {
        this._schema = schema;
        this._dbPlugin = dbPlugin;
    }

    saveChanges(done: (result: number, error?: any) => void) {

        const preparedAdds = this.additions.map(w => this._schema.prepare(w));

        // need to hash here, not on add in case something is changed after adding
        const hashedAdds = toMap(this.additions, w => this._schema.hash(w, HashType.Object));

        this._dbPlugin.bulkOperations<any>(this._schema, {
            // prepare is responsible for creating a new clean object 
            // with only properties that should be saved and run any serializers
            adds: preparedAdds,
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
                const hash = this._schema.hash(add as any, HashType.Object);
                const found = hashedAdds.get(hash);

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

                this.additions.push(enriched);

                result.push(enriched as any);
            }

            done(result);
        } catch (e: any) {
            done([], e);
        }
    }
}