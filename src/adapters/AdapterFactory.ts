import { DbSetFetchMediator } from "./DbSetFetchMediator";
import { DbSetGeneralAdapter } from "./DbSetGeneralAdapter";
import { DbSetModificationAdapter } from "./DbSetModificationAdapter";
import { DbSetType, IDbSetProps, IStoreDbSetProps } from "../types/dbset-types";
import { IDbRecord } from "../types/entity-types";
import { IDbSetFetchMediator, IDbSetGeneralAdapter, IDbSetModificationAdapter } from "../types/adapter-types";
import { DbSetStatefulModificationAdapter } from './stateful/DbSetStatefulModificationAdapter';
import { IDbSetChangeTracker } from "../types/change-tracking-types";

export class AdapterFactory<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TDbPlugin> {

    private readonly _props: IDbSetProps<TDocumentType, TEntity, TExclusions>;
    private readonly _type: DbSetType;
    private readonly changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>;

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, type: DbSetType, changeTracker:  IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>) {
        this._props = props;
        this._type = type;
        this.changeTracker = changeTracker;
    }

    createFetchMediator(): IDbSetFetchMediator<TDocumentType, TEntity, TExclusions> {
        return new DbSetFetchMediator<TDocumentType, TEntity, TExclusions, TDbPlugin>(this._props, this._type, this.changeTracker)
    }

    createGeneralAdapter(): IDbSetGeneralAdapter<TDocumentType, TEntity, TExclusions> {
        return new DbSetGeneralAdapter<TDocumentType, TEntity, TExclusions, TDbPlugin>(this._props, this._type, this.changeTracker)
    }

    createModificationAdapter(): IDbSetModificationAdapter<TDocumentType, TEntity, TExclusions> {

        if (this._type === "stateful") {
            return new DbSetStatefulModificationAdapter<TDocumentType, TEntity, TExclusions, TDbPlugin>(this._props as IStoreDbSetProps<TDocumentType, TEntity, TExclusions>, this._type, this.changeTracker)
        }

        return new DbSetModificationAdapter<TDocumentType, TEntity, TExclusions, TDbPlugin>(this._props, this._type, this.changeTracker)
    }
}