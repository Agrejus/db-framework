import { DbSetPickDefaultActionRequired, EntityComparator, EntitySelector } from './common-types';
import { EntityIdKey, IDbRecord } from './entity-types';
import { DbSetOnChangeEvent, IDbSet, IDbSetProps, IStatefulDbSet, IStoreDbSetProps } from './dbset-types';
import { DbSet } from '../context/dbset/DbSet';
import { IDataContext } from './context-types';
import { IDbPlugin, IDbPluginOptions } from './plugin-types';
import { DataContext } from '../context/DataContext';

export interface IDbSetStatefulBuilderParams<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TResult extends IDbSet<TDocumentType, TEntity, TExclusions>, TEnhanced extends TEntity = TEntity>
    extends IDbSetBuilderParams<TDocumentType, TEntity, TExclusions, TResult, TEnhanced> {
    onChange: DbSetOnChangeEvent<TDocumentType, TEntity>;
}

export interface IDbSetBuilderParams<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TResult extends IDbSet<TDocumentType, TEntity, TExclusions>, TEnhanced extends TEntity = TEntity> {
    context: IDataContext<TDocumentType, TEntity>;
    documentType: TDocumentType;
    defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity, TExclusions>;
    exclusions: (keyof TEntity)[];
    readonly: boolean;
    extend: DbSetExtenderCreator<TDocumentType, TEntity, TExclusions, TResult>[]
    map: PropertyMap<TDocumentType, TEntity, any>[];
    filterSelector: EntitySelector<TDocumentType, TEntity>;
    entityComparator: EntityComparator<TDocumentType, TEntity> | null;
    idCreator: CustomIdCreator<TDocumentType, TEntity>;
    enhancer: EntityEnhancer<TDocumentType, TEntity, TEnhanced, TExclusions>;
}


export type ConvertDateToString<T> = T extends Date ? string : T;
export type DbSetStoreExtenderCreator<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TResult extends IStatefulDbSet<TDocumentType, TEntity, TExclusions>> = (i: DbSetExtender<TDocumentType, TEntity, TExclusions>, args: IStoreDbSetProps<TDocumentType, TEntity, TExclusions>) => TResult
export type DbSetExtenderCreator<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TResult extends IDbSet<TDocumentType, TEntity, TExclusions>> = (i: DbSetExtender<TDocumentType, TEntity, TExclusions>, args: IDbSetProps<TDocumentType, TEntity, TExclusions>) => TResult

export type PropertyMap<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TProperty extends keyof TEntity> = { property: TProperty, map: (value: ConvertDateToString<TEntity[TProperty]>, entity: TEntity) => TEntity[TProperty] }

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

export type EntityEnhancer<
    TDocumentType extends string,
    TEntity extends IDbRecord<TDocumentType>,
    TEnhanced extends TEntity,
    TExclusions extends keyof TEntity = never
> = <
    TPluginOptions extends IDbPluginOptions = IDbPluginOptions,
    TDbPlugin extends IDbPlugin<TDocumentType, TEntity, TExclusions> = IDbPlugin<TDocumentType, TEntity, TExclusions>
>(entity: TEntity, context: DataContext<TDocumentType, TEntity, TExclusions, TPluginOptions, TDbPlugin>) => TEnhanced