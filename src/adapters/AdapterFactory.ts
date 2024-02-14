import { DbSetFetchAdapter } from "./DbSetFetchAdapter";
import { DbSetGeneralAdapter } from "./DbSetGeneralAdapter";
import { DbSetModificationAdapter } from "./DbSetModificationAdapter";
import { DbSetType, IDbSetApi, IDbSetProps, IStoreDbSetProps } from "../types/dbset-types";
import { IDbRecord } from "../types/entity-types";
import { IDbSetFetchAdapter, IDbSetGeneralAdapter, IDbSetModificationAdapter } from "../types/adapter-types";
import { DbSetStatefulModificationAdapter } from './stateful/DbSetStatefulModificationAdapter';
import { IDbSetChangeTracker } from "../types/change-tracking-types";
import { ReadonlyChangeTrackingAdapter } from "./change-tracking/ReadonlyChangeTrackingAdapter";
import { CustomChangeTrackingAdapter } from "./change-tracking/CustomChangeTrackingAdapter";
import { EntityChangeTrackingAdapter } from "./change-tracking/EntityChangeTrackingAdapter";
import { IPrivateContext } from "../types/context-types";

export class AdapterFactory<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> {

    private readonly _props: IDbSetProps<TDocumentType, TEntity, TExclusions>;
    private readonly _type: DbSetType;
    private readonly changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>;

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, type: DbSetType, changeTracker:  IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>) {
        this._props = props;
        this._type = type;
        this.changeTracker = changeTracker;
    }

    createFetchAdapter(): IDbSetFetchAdapter<TDocumentType, TEntity, TExclusions> {
        return new DbSetFetchAdapter<TDocumentType, TEntity, TExclusions>(this._props, this._type, this.changeTracker)
    }

    createGeneralAdapter(): IDbSetGeneralAdapter<TDocumentType, TEntity, TExclusions> {
        return new DbSetGeneralAdapter<TDocumentType, TEntity, TExclusions>(this._props, this._type, this.changeTracker)
    }

    createModificationAdapter(): IDbSetModificationAdapter<TDocumentType, TEntity, TExclusions> {

        if (this._type === "stateful") {
            return new DbSetStatefulModificationAdapter<TDocumentType, TEntity, TExclusions>(this._props as IStoreDbSetProps<TDocumentType, TEntity, TExclusions>, this._type, this.changeTracker)
        }

        return new DbSetModificationAdapter<TDocumentType, TEntity, TExclusions>(this._props, this._type, this.changeTracker)
    }
}