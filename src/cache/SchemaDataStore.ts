import { DeepPartial } from "../../dist";
import { ExpandedSchema } from "../schema";
import { SchemaDefinition } from "../schema/types/Definition";
import { IDbRecord } from "../types/entity-types";
import { CacheBase } from "./base/CacheBase";

export type SchemaCache<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = {
    hasChanges?: (entity: TEntity) => boolean;
    getChanges?: (entity: TEntity) => DeepPartial<TEntity>;
    strip?: (entity: TEntity) => TEntity;
    enableChangeTracking?: (entity: TEntity) => TEntity;
    expandedSchema?: ExpandedSchema;
    deepMerge?: (entity: TEntity, partial: DeepPartial<TEntity>) => TEntity
}

export class SchemaDataStore<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends CacheBase<TDocumentType, TEntity, TExclusions> {

    private _expandedSchema: ExpandedSchema | null = null;
    private readonly _schema?: SchemaDefinition<TDocumentType, TEntity>;

    constructor(dataContextId: string, documentType: TDocumentType, schema?: SchemaDefinition<TDocumentType, TEntity>) {
        super("Schema", dataContextId, documentType);
        this._schema = schema;
    }

    expand() {

        if (this._schema == null) {
            return null
        }

        if (this._expandedSchema != null) {
            return this._expandedSchema;
        }

        const cache = this.get();

        if (cache != null && cache.expandedSchema != null) {
            this._expandedSchema = cache.expandedSchema;

            return this._expandedSchema
        }

        const expandedSchema = this._schema.expand();
        this._expandedSchema = expandedSchema;

        cache.expandedSchema = expandedSchema;

        this.put(cache);

        return expandedSchema;
    }

    put(value: DeepPartial<SchemaCache<TDocumentType, TEntity>>) {
        const cache = this.get();

        this.putValue<SchemaCache<TDocumentType, TEntity>>({ ...cache, ...(value as any) });
    }

    get() {
        return this.getValue<SchemaCache<TDocumentType, TEntity>>() ?? {};
    }

    clear(...keys: string[]) {
        this.clearValue(...keys);
    }
}