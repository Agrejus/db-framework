import { IDbSetChangeTracker } from "../../types/change-tracking-types";
import { DbFrameworkEnvironment } from "../../types/context-types";
import { IDbSetProps } from "../../types/dbset-types";
import { IDbRecord } from "../../types/entity-types";
import { IDbPlugin } from "../../types/plugin-types";
import { CustomChangeTrackingAdapter } from "./CustomChangeTrackingAdapter";
import { EntityChangeTrackingAdapter } from "./EntityChangeTrackingAdapter";
import { ReadonlyChangeTrackingAdapter } from "./ReadonlyChangeTrackingAdapter";

export class ChangeTrackingFactory<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TDbPlugin> {

    private readonly _props: IDbSetProps<TDocumentType, TEntity, TExclusions>;
    private readonly _environment: DbFrameworkEnvironment;
    private readonly _contextName: string;
    private readonly _dbPlugin: TDbPlugin;

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, dbPlugin: TDbPlugin, contextName: string, environment: DbFrameworkEnvironment) {
        this._props = props;
        this._environment = environment;
        this._contextName = contextName;
        this._dbPlugin = dbPlugin;
    }

    getTracker(): IDbSetChangeTracker<TDocumentType, TEntity, TExclusions> {

        const untrackedPropertyNames = new Set<string>([
            EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY,
            EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER,
            EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY,
            EntityChangeTrackingAdapter.TIMESTAMP_ENTITY_KEY
        ]);

        if (this._props.readonly === true) {
            return new ReadonlyChangeTrackingAdapter(this._props, {
                environment: this._environment,
                contextName: this._contextName,
                untrackedPropertyNames
            }, this._dbPlugin as IDbPlugin<TDocumentType, TEntity, TExclusions>);
        }

        if (this._props.entityComparator != null) {
            return new CustomChangeTrackingAdapter(this._props, {
                environment: this._environment,
                contextName: this._contextName,
                untrackedPropertyNames: new Set<string>()
            }, this._dbPlugin as IDbPlugin<TDocumentType, TEntity, TExclusions>, this._props.entityComparator);
        }

        return new EntityChangeTrackingAdapter(this._props, {
            environment: this._environment,
            contextName: this._contextName,
            untrackedPropertyNames
        }, this._dbPlugin as IDbPlugin<TDocumentType, TEntity, TExclusions>);
    }
}