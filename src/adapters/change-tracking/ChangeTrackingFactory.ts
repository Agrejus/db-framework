import { IDbSetChangeTracker } from "../../types/change-tracking-types";
import { DbSetPickDefaultActionRequired, DeepPartial } from "../../types/common-types";
import { DbFrameworkEnvironment } from "../../types/context-types";
import { IDbSetProps } from "../../types/dbset-types";
import { IDbRecord, OmittedEntity } from "../../types/entity-types";
import { CustomChangeTrackingAdapter } from "./CustomChangeTrackingAdapter";
import { EntityChangeTrackingAdapter } from "./EntityChangeTrackingAdapter";
import { ReadonlyChangeTrackingAdapter } from "./ReadonlyChangeTrackingAdapter";

export class ChangeTrackingFactory<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> {

    private readonly _props: IDbSetProps<TDocumentType, TEntity, TExclusions>;
    private readonly _idPropertyName: keyof TEntity;
    private readonly _environment: DbFrameworkEnvironment;

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, idPropertyName: keyof TEntity, environment: DbFrameworkEnvironment) {
        this._props = props;
        this._idPropertyName = idPropertyName;
        this._environment = environment;
    }

    getTracker(): IDbSetChangeTracker<TDocumentType, TEntity, TExclusions> {
        if (this._props.readonly === true) {
            return new ReadonlyChangeTrackingAdapter(this._idPropertyName, this._props.map, this._environment);
        }

        if (this._props.entityComparator != null) {
            return new CustomChangeTrackingAdapter(this._idPropertyName, this._props.map, this._environment, this._props.entityComparator);
        }

        return new EntityChangeTrackingAdapter(this._idPropertyName, this._props.map, this._environment);
    }
}