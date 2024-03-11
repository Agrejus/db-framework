import { DbSetPickDefaultActionOptional, DeepPartial, EntityComparator, EntitySelector, ToUnion } from "../../../types/common-types";
import { Deserializer, IChainIdBuilder, IDbSetStatefulBuilderParams, IIdBuilderBase, ITerminateIdBuilder, Serializer } from "../../../types/dbset-builder-types";
import { DbSetRemoteOnChangeEvent } from "../../../types/dbset-types";
import { IDbRecord, OmittedEntity } from "../../../types/entity-types";
import { IDbPlugin } from "../../../types/plugin-types";
import { BaseDbSetBuilder } from "./base/BaseDbSetBuilder";

export class StatefulDbSetBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TDbPlugin> extends BaseDbSetBuilder<TDocumentType, TEntity, TExclusions, TDbPlugin, IDbSetStatefulBuilderParams<TDocumentType, TEntity, TExclusions>> {

    onChange(callback: DbSetRemoteOnChangeEvent<TDocumentType, TEntity>) {
        this._params.onChange = callback;

        return new StatefulDbSetBuilder<TDocumentType, TEntity, TExclusions, TDbPlugin>({
            InstanceCreator: this.InstanceCreator,
            onCreate: this._onCreate,
            params: this._params
        });
    }

    keys(builder: (b: IIdBuilderBase<TDocumentType, TEntity>) => IChainIdBuilder<TDocumentType, TEntity> | ITerminateIdBuilder<TDocumentType, TEntity>) {
        return super._keys(builder, StatefulDbSetBuilder<TDocumentType, TEntity, TExclusions, TDbPlugin>);
    }

    defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity, TExclusions>): this
    defaults(value: DeepPartial<OmittedEntity<TEntity, TExclusions>>): this
    defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity, TExclusions> | DeepPartial<OmittedEntity<TEntity, TExclusions>>) {
        return super._defaults(value, StatefulDbSetBuilder<TDocumentType, TEntity, TExclusions, TDbPlugin>);
    }

    exclude<T extends keyof TEntity>(...exclusions: T[]) {
        return super._exclude(StatefulDbSetBuilder<TDocumentType, TEntity, T | TExclusions, TDbPlugin>, ...exclusions)
    }

    readonly() {
        return super._readonly(StatefulDbSetBuilder<TDocumentType, Readonly<TEntity>, TExclusions, TDbPlugin>)
    }

    serialize(serializer: Serializer<TDocumentType, TEntity>) {
        return super._serialize(serializer, StatefulDbSetBuilder<TDocumentType, TEntity, TExclusions, TDbPlugin>)
    }
    
    deserialize(deserializer: Deserializer<TDocumentType, TEntity>) {
        return super._deserialize(deserializer, StatefulDbSetBuilder<TDocumentType, TEntity, TExclusions, TDbPlugin>)
    }

    filter(selector: EntitySelector<TDocumentType, TEntity>) {
        return super._filter(selector, StatefulDbSetBuilder<TDocumentType, TEntity, TExclusions, TDbPlugin>)
    }

    getChanges(comparison: EntityComparator<TDocumentType, TEntity>) {
        return super._getChanges(comparison, StatefulDbSetBuilder<TDocumentType, TEntity, TExclusions, TDbPlugin>)
    }

    enhance<TEnhanced extends TEntity>(enhancer: (entity: TEntity) => TEnhanced) {
        return super._enhance(enhancer, StatefulDbSetBuilder<TDocumentType, TEnhanced, TExclusions | ToUnion<TEnhanced>, TDbPlugin>)
    }
}