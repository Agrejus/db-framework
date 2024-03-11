import { DbSetPickDefaultActionOptional, DeepPartial, EntityComparator, EntitySelector, ToUnion } from "../../../types/common-types";
import { IDbRecord, OmittedEntity } from "../../../types/entity-types";
import { IChainIdBuilder, IIdBuilderBase, ITerminateIdBuilder, Serializer, Deserializer } from '../../../types/dbset-builder-types';
import { BaseDbSetBuilder } from "./base/BaseDbSetBuilder";

export class DefaultDbSetBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TDbPlugin> extends BaseDbSetBuilder<TDocumentType, TEntity, TExclusions, TDbPlugin> {

    keys(builder: (b: IIdBuilderBase<TDocumentType, TEntity>) => IChainIdBuilder<TDocumentType, TEntity> | ITerminateIdBuilder<TDocumentType, TEntity>) {
        return super._keys(builder, DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions, TDbPlugin>);
    }

    defaults(value: DeepPartial<OmittedEntity<TEntity, TExclusions>>): DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions, TDbPlugin>;
    defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity, TExclusions>): DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions, TDbPlugin>
    defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity, TExclusions> | DeepPartial<OmittedEntity<TEntity, TExclusions>>) {
        return super._defaults(value, DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions, TDbPlugin>);
    }

    exclude<T extends keyof TEntity>(...exclusions: T[]) {
        return super._exclude(DefaultDbSetBuilder<TDocumentType, TEntity, T | TExclusions, TDbPlugin>, ...exclusions)
    }

    readonly() {
        return super._readonly(DefaultDbSetBuilder<TDocumentType, Readonly<TEntity>, TExclusions, TDbPlugin>)
    }

    serialize(serializer: Serializer<TDocumentType, TEntity>) {
        return super._serialize(serializer, DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions, TDbPlugin>)
    }

    deserialize(deserializer: Deserializer<TDocumentType, TEntity>) {
        return super._deserialize(deserializer, DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions, TDbPlugin>)
    }

    filter(selector: EntitySelector<TDocumentType, TEntity>) {
        return super._filter(selector, DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions, TDbPlugin>)
    }

    getChanges(comparison: EntityComparator<TDocumentType, TEntity>) {
        return super._getChanges(comparison, DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions, TDbPlugin>)
    }

    enhance<TEnhanced>(enhancer: (entity: TEntity) => Required<TEnhanced>) {
        return super._enhance(enhancer, DefaultDbSetBuilder<TDocumentType, TEntity & TEnhanced, TExclusions | ToUnion<TEnhanced>, TDbPlugin>)
    }
}