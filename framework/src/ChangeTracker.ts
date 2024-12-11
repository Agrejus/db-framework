import { EntityChanges, IdType, NonNullCreateEntity, NonNullEntity } from "@agrejus/db-framework-core";
import { CompiledSchema } from "@agrejus/db-framework-core";
import { EntityResolveMany, ErrorCallback } from "./types";

export class ChangeTracker<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> {

    protected removals: Map<[IdType], NonNullEntity<TEntity>> = new Map<[IdType], NonNullEntity<TEntity>>();
    protected additions: NonNullCreateEntity<TEntity>[] = [];
    protected removeById: Set<[IdType]> = new Set<[IdType]>();
    protected attachments: Map<[IdType], NonNullEntity<TEntity>> = new Map<[IdType], NonNullEntity<TEntity>>();
    private _schema: CompiledSchema<TEntity>;

    constructor(schema: CompiledSchema<TEntity>) {
        this._schema = schema;
    }

    add<TEntity extends {}>(entities: NonNullCreateEntity<TEntity, TEnhancedPropertyNames | TComputedPropertyNames>[], resolve: EntityResolveMany<TEntity>, reject: ErrorCallback) {
        // const ids = schema.getIds(entities);
        // this.additions.set
        // we need to send each entity through some sort of enricher to ensure the following
        // 1.  Defaults are set (Id's and other properties)
        // 2.  Computed Property Functions Are Run
        // 3.  Return Result

        const result: NonNullEntity<TEntity>[] = [];

        try {

            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i];

                const enriched: NonNullCreateEntity<TEntity> = this._schema.enrich(entity as any) as any;

                this.additions.push(enriched);

                result.push(enriched as any);
            }
            
            resolve(result);
        } catch (e: any) {
            reject(e);
        }
    }

    getChanges(): EntityChanges<TEntity> {

        return {
            adds: this.additions,
            removes: {
                entities: [],
                ids: []
            },
            updates: null as any

        }
    }

}