import { DbSetPickDefaultActionOptional, DeepPartial, EntityComparator, EntitySelector, ToUnion } from "../../../types/common-types";
import { IDbRecord, OmittedEntity } from "../../../types/entity-types";
import { IChainIdBuilder, IIdBuilderBase, ITerminateIdBuilder, Serializer, Deserializer } from '../../../types/dbset-builder-types';
import { BaseDbSetBuilder } from "./base/BaseDbSetBuilder";

export class DefaultDbSetBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends BaseDbSetBuilder<TDocumentType, TEntity, TExclusions> {

    keys(builder: (b: IIdBuilderBase<TDocumentType, TEntity>) => IChainIdBuilder<TDocumentType, TEntity> | ITerminateIdBuilder<TDocumentType, TEntity>) {
        return super._keys(builder, DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions>);
    }

    defaults(value: DeepPartial<OmittedEntity<TEntity, TExclusions>>): DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions>;
    defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity, TExclusions>): DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions>
    defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity, TExclusions> | DeepPartial<OmittedEntity<TEntity, TExclusions>>) {
        return super._defaults(value, DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions>);
    }

    exclude<T extends keyof TEntity>(...exclusions: T[]) {
        return super._exclude(DefaultDbSetBuilder<TDocumentType, TEntity, T | TExclusions>, ...exclusions)
    }

    readonly() {
        return super._readonly(DefaultDbSetBuilder<TDocumentType, Readonly<TEntity>, TExclusions>)
    }

    serialize(serializer: Serializer<TDocumentType, TEntity>) {
        return super._serialize(serializer, DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions>)
    }
    
    deserialize(deserializer: Deserializer<TDocumentType, TEntity>) {
        return super._deserialize(deserializer, DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions>)
    }

    filter(selector: EntitySelector<TDocumentType, TEntity>) {
        return super._filter(selector, DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions>)
    }

    getChanges(comparison: EntityComparator<TDocumentType, TEntity>) {
        return super._getChanges(comparison, DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions>)
    }

    enhance<TEnhanced>(enhancer: (entity: TEntity) => Required<TEnhanced>) {
        return super._enhance(enhancer, DefaultDbSetBuilder<TDocumentType, TEntity & TEnhanced, TExclusions | ToUnion<TEnhanced>>)
    }
}