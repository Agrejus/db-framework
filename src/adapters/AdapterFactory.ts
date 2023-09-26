import { DbSetFetchAdapter } from "./DbSetFetchAdapter";
import { DbSetGeneralAdapter } from "./DbSetGeneralAdapter";
import { DbSetModificationAdapter } from "./DbSetModificationAdapter";
import { DbSetType, IDbSetProps, IStoreDbSetProps } from "../types/dbset-types";
import { IDbRecord } from "../types/entity-types";
import { IDbSetFetchAdapter, IDbSetGeneralAdapter, IDbSetModificationAdapter } from "../types/adapter-types";
import { DbSetStoreModificationAdapter } from './store/DbSetStoreModificationAdapter';

export class AdapterFactory<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> {

    private _props: IDbSetProps<TDocumentType, TEntity>;
    private _type: DbSetType;

    constructor(props: IDbSetProps<TDocumentType, TEntity>, type: DbSetType) {
        this._props = props;
        this._type = type;
    }

    createFetchAdapter(): IDbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions> {
        return new DbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions>(this._props, this._type)
    }

    createGeneralAdapter(): IDbSetGeneralAdapter<TDocumentType, TEntity, TExtraExclusions> {
        return new DbSetGeneralAdapter<TDocumentType, TEntity, TExtraExclusions>(this._props, this._type)
    }

    createModificationAdapter(): IDbSetModificationAdapter<TDocumentType, TEntity, TExtraExclusions> {

        if (this._type === "store") {
            return new DbSetStoreModificationAdapter<TDocumentType, TEntity, TExtraExclusions>(this._props as IStoreDbSetProps<TDocumentType, TEntity>, this._type)
        }

        return new DbSetModificationAdapter<TDocumentType, TEntity, TExtraExclusions>(this._props, this._type)
    }
}