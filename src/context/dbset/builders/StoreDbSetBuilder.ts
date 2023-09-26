import { IDbSetStoreBuilderParams } from "../../../types/dbset-builder-types";
import { DbSetOnChangeEvent, IStoreDbSet } from "../../../types/dbset-types";
import { IDbRecord } from "../../../types/entity-types";
import { DefaultDbSetBuilder } from "./DefaultDbSetBuilder";

export class StoreDbSetBuilder<
    TDocumentType extends string,
    TEntity extends IDbRecord<TDocumentType>,
    TExtraExclusions extends string,
    TResult extends IStoreDbSet<TDocumentType, TEntity, TExtraExclusions>,
    TParams extends IDbSetStoreBuilderParams<TDocumentType, TEntity, TExtraExclusions, TResult>> extends DefaultDbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult, TParams> {

    onChange(callback: DbSetOnChangeEvent<TDocumentType, TEntity>) {
        this._params.onChange = callback;
        return new StoreDbSetBuilder<TDocumentType, TEntity, TExtraExclusions, TResult, TParams>(this._onCreate, this._params, this.InstanceCreator);
    }

}