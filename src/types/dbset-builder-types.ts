import { DbSetPickDefaultActionRequired, DeepPartial, EntityComparator, EntitySelector } from './common-types';
import { EntityIdKey, IDbRecord } from './entity-types';
import { DbSetOnChangeEvent, IDbSet, IDbSetProps, IStatefulDbSet, IStoreDbSetProps } from './dbset-types';
import { DbSet } from '../context/dbset/DbSet';
import { IDataContext } from './context-types';

export interface IDbSetStatefulBuilderParams<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity>
    extends IDbSetBuilderParams<TDocumentType, TEntity, TExclusions> {
    onChange: DbSetOnChangeEvent<TDocumentType, TEntity>;
}

export interface IDbSetBuilderParams<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {
    context: IDataContext<TDocumentType, TEntity>;
    documentType: TDocumentType;
    defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity, TExclusions>;
    exclusions: (keyof TEntity)[];
    readonly: boolean;
    serializer: Serializer<TDocumentType, TEntity> | null;
    deserializer: Deserializer<TDocumentType, TEntity> | null;
    filterSelector: EntitySelector<TDocumentType, TEntity>;
    entityComparator: EntityComparator<TDocumentType, TEntity> | null;
    idCreator: CustomIdCreator<TDocumentType, TEntity>;
    enhancer?: EntityEnhancer<TDocumentType, TEntity>;
}


export type ConvertDateToString<T> = T extends Date ? string : T;
export type DbSetStoreExtenderCreator<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TResult extends IStatefulDbSet<TDocumentType, TEntity, TExclusions>> = (i: DbSetExtender<TDocumentType, TEntity, TExclusions>, args: IStoreDbSetProps<TDocumentType, TEntity, TExclusions>) => TResult
export type DbSetExtenderCreator<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TResult extends IDbSet<TDocumentType, TEntity, TExclusions>> = (i: DbSetExtender<TDocumentType, TEntity, TExclusions>, args: IDbSetProps<TDocumentType, TEntity, TExclusions>) => TResult

export type Serializer<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = (entity: TEntity) => any;
export type Deserializer<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = (raw: any) => TEntity;

export interface ITerminateIdBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {

}

export interface IChainIdBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {
    /**
     * Used to build a key for the entity.  Key will be built in the order
     * the keys or selectors are added
     * @param key Key or property selector
     */
    add(key: EntityIdKey<TDocumentType, TEntity>): IChainIdBuilder<TDocumentType, TEntity>;
}

export interface IIdBuilderBase<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> extends IChainIdBuilder<TDocumentType, TEntity> {

    /**
     * No keys, will only allow one single instance or record for the document type
     */
    none(): ITerminateIdBuilder<TDocumentType, TEntity>;

    /**
     * Key will be automatically generated
     */
    auto(): ITerminateIdBuilder<TDocumentType, TEntity>;

    /**
     * Key will be automatically generated
     */
    custom(creator: CustomIdCreator<TDocumentType, TEntity>): ITerminateIdBuilder<TDocumentType, TEntity>;
}

export type CustomIdCreator<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = (entity: TEntity) => string;

export type DbSetExtender<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> = new (props: IDbSetProps<TDocumentType, TEntity, TExclusions>) => DbSet<TDocumentType, TEntity, TExclusions>;

export type EntityEnhancer<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = (entity: TEntity) => TEntity