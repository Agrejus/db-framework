import { DbSetFetchAdapter } from "./DbSetFetchAdapter";
import { DbSetGeneralAdapter } from "./DbSetGeneralAdapter";
import { DbSetModificationAdapter } from "./DbSetModificationAdapter";
import { DbSetType, IDbSetProps, IStoreDbSetProps } from "../types/dbset-types";
import { IDbRecord } from "../types/entity-types";
import { IDbSetFetchAdapter, IDbSetGeneralAdapter, IDbSetModificationAdapter } from "../types/adapter-types";
import { DbSetStoreModificationAdapter } from './store/DbSetStoreModificationAdapter';

export class AdapterFactory<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> {

    private _props: IDbSetProps<TDocumentType, TEntity, TExclusions>;
    private _type: DbSetType;

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, type: DbSetType) {
        this._props = props;
        this._type = type;
    }

    createFetchAdapter(): IDbSetFetchAdapter<TDocumentType, TEntity, TExclusions> {
        return new DbSetFetchAdapter<TDocumentType, TEntity, TExclusions>(this._props, this._type)
    }

    createGeneralAdapter(): IDbSetGeneralAdapter<TDocumentType, TEntity, TExclusions> {
        return new DbSetGeneralAdapter<TDocumentType, TEntity, TExclusions>(this._props, this._type)
    }

    createModificationAdapter(): IDbSetModificationAdapter<TDocumentType, TEntity, TExclusions> {

        if (this._type === "store") {
            return new DbSetStoreModificationAdapter<TDocumentType, TEntity, TExclusions>(this._props as IStoreDbSetProps<TDocumentType, TEntity, TExclusions>, this._type)
        }

        return new DbSetModificationAdapter<TDocumentType, TEntity, TExclusions>(this._props, this._type)
    }
}