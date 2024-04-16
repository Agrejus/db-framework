import { DbSetFetchAdapter } from "./DbSetFetchAdapter";
import { DbSetGeneralAdapter } from "./DbSetGeneralAdapter";
import { DbSetModificationAdapter } from "./DbSetModificationAdapter";
import { DbSetType, IDbSetProps, IStoreDbSetProps } from "../types/dbset-types";
import { IDbRecord } from "../types/entity-types";
import { IDbSetFetchAdapter, IDbSetGeneralAdapter, IDbSetModificationAdapter } from "../types/adapter-types";
import { DbSetStatefulModificationAdapter } from './stateful/DbSetStatefulModificationAdapter';
import { IDbSetChangeTracker } from "../types/change-tracking-types";
import { SchemaDataStore } from '../cache/SchemaDataStore';

export class AdapterFactory<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TDbPlugin> {

    private readonly _props: IDbSetProps<TDocumentType, TEntity, TExclusions>;
    private readonly _type: DbSetType;
    private readonly changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>;
    private readonly _idPropertyName: keyof TEntity;
    private readonly _schemaCache: SchemaDataStore<TDocumentType, TEntity, TExclusions>;

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, type: DbSetType, idPropertyName: keyof TEntity, changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>, schemaCache: SchemaDataStore<TDocumentType, TEntity, TExclusions>) {
        this._props = props;
        this._type = type;
        this.changeTracker = changeTracker;
        this._idPropertyName = idPropertyName;
        this._schemaCache = schemaCache;
    }

    createFetchMediator(): IDbSetFetchAdapter<TDocumentType, TEntity, TExclusions> {
        return new DbSetFetchAdapter<TDocumentType, TEntity, TExclusions, TDbPlugin>(this._props, this._type, this._idPropertyName, this.changeTracker, this._schemaCache);
    }

    createGeneralAdapter(): IDbSetGeneralAdapter<TDocumentType, TEntity, TExclusions> {
        return new DbSetGeneralAdapter<TDocumentType, TEntity, TExclusions, TDbPlugin>(this._props, this._type, this.changeTracker, this._schemaCache)
    }

    createModificationAdapter(): IDbSetModificationAdapter<TDocumentType, TEntity, TExclusions> {

        if (this._type === "stateful") {
            return new DbSetStatefulModificationAdapter<TDocumentType, TEntity, TExclusions, TDbPlugin>(this._props as IStoreDbSetProps<TDocumentType, TEntity, TExclusions>, this._type, this._idPropertyName, this.changeTracker)
        }

        return new DbSetModificationAdapter<TDocumentType, TEntity, TExclusions, TDbPlugin>(this._props, this._type, this._idPropertyName, this.changeTracker, this._schemaCache)
    }
}