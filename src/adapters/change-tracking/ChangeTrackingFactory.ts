import { IDbSetChangeTracker } from "../../types/change-tracking-types";
import { DbFrameworkEnvironment } from "../../types/context-types";
import { IDbSetProps } from "../../types/dbset-types";
import { IDbRecord } from "../../types/entity-types";
import { CustomChangeTrackingAdapter } from "./CustomChangeTrackingAdapter";
import { EntityChangeTrackingAdapter } from "./EntityChangeTrackingAdapter";
import { ReadonlyChangeTrackingAdapter } from "./ReadonlyChangeTrackingAdapter";

export class ChangeTrackingFactory<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> {

    private readonly _props: IDbSetProps<TDocumentType, TEntity, TExclusions>;
    private readonly _idPropertyName: keyof TEntity;
    private readonly _environment: DbFrameworkEnvironment;
    private readonly _contextName: string;

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, idPropertyName: keyof TEntity, contextName: string, environment: DbFrameworkEnvironment) {
        this._props = props;
        this._idPropertyName = idPropertyName;
        this._environment = environment;
        this._contextName = contextName;
    }

    getTracker(): IDbSetChangeTracker<TDocumentType, TEntity, TExclusions> {
        if (this._props.readonly === true) {

            const untrackedPropertyNames = new Set<string>([
                EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY,
                EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER,
                EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY
            ]);

            return new ReadonlyChangeTrackingAdapter(this._props, {
                idPropertyName: this._idPropertyName,
                environment: this._environment,
                contextName: this._contextName,
                untrackedPropertyNames
            });
        }

        if (this._props.entityComparator != null) {
            return new CustomChangeTrackingAdapter(this._props, {
                idPropertyName: this._idPropertyName,
                environment: this._environment,
                contextName: this._contextName,
                untrackedPropertyNames: new Set<string>()
            }, this._props.entityComparator);
        }

        const untrackedPropertyNames = new Set<string>([
            EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY,
            EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER,
            EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY
        ]);

        return new EntityChangeTrackingAdapter(this._props, {
            idPropertyName: this._idPropertyName,
            environment: this._environment,
            contextName: this._contextName,
            untrackedPropertyNames
        });
    }
}