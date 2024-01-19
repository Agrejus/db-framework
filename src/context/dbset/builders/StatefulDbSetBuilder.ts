import { DbSetPickDefaultActionOptional, DeepPartial, EntityComparator, EntitySelector, ToUnion } from "../../../types/common-types";
import { IChainIdBuilder, IDbSetStatefulBuilderParams, IIdBuilderBase, ITerminateIdBuilder, PropertyMap } from "../../../types/dbset-builder-types";
import { DbSetRemoteOnChangeEvent } from "../../../types/dbset-types";
import { IDbRecord, OmittedEntity } from "../../../types/entity-types";
import { BaseDbSetBuilder } from "./base/BaseDbSetBuilder";

export class StatefulDbSetBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends BaseDbSetBuilder<TDocumentType, TEntity, TExclusions, IDbSetStatefulBuilderParams<TDocumentType, TEntity, TExclusions>> {

    onChange(callback: DbSetRemoteOnChangeEvent<TDocumentType, TEntity>) {
        this._params.onChange = callback;

        return new StatefulDbSetBuilder<TDocumentType, TEntity, TExclusions>({
            InstanceCreator: this.InstanceCreator,
            onCreate: this._onCreate,
            params: this._params
        });
    }

    keys(builder: (b: IIdBuilderBase<TDocumentType, TEntity>) => IChainIdBuilder<TDocumentType, TEntity> | ITerminateIdBuilder<TDocumentType, TEntity>) {
        return super._keys(builder, StatefulDbSetBuilder<TDocumentType, TEntity, TExclusions>);
    }

    defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity, TExclusions>): this
    defaults(value: DeepPartial<OmittedEntity<TEntity, TExclusions>>): this
    defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity, TExclusions> | DeepPartial<OmittedEntity<TEntity, TExclusions>>) {
        return super._defaults(value, StatefulDbSetBuilder<TDocumentType, TEntity, TExclusions>);
    }

    exclude<T extends keyof TEntity>(...exclusions: T[]) {
        return super._exclude(StatefulDbSetBuilder<TDocumentType, TEntity, T | TExclusions>, ...exclusions)
    }

    readonly() {
        return super._readonly(StatefulDbSetBuilder<TDocumentType, Readonly<TEntity>, TExclusions>)
    }

    map<T extends keyof TEntity>(propertyMap: PropertyMap<TDocumentType, TEntity, T>) {
        return super._map(propertyMap, StatefulDbSetBuilder<TDocumentType, TEntity, TExclusions>)
    }

    filter(selector: EntitySelector<TDocumentType, TEntity>) {
        return super._filter(selector, StatefulDbSetBuilder<TDocumentType, TEntity, TExclusions>)
    }

    getChanges(comparison: EntityComparator<TDocumentType, TEntity>) {
        return super._getChanges(comparison, StatefulDbSetBuilder<TDocumentType, TEntity, TExclusions>)
    }

    enhance<TEnhanced extends TEntity>(enhancer: (entity: TEntity) => TEnhanced) {
        return super._enhance(enhancer, StatefulDbSetBuilder<TDocumentType, TEnhanced, TExclusions | ToUnion<TEnhanced>>)
    }
}