import { DbSetPickDefaultActionOptional, DeepPartial, EntityComparator, EntitySelector } from "../../../types/common-types";
import { IDbSet, IDbSetProps, IDbSetBase } from "../../../types/dbset-types";
import { IDbRecord, OmittedEntity } from "../../../types/entity-types";
import { DbSetExtender, IChainIdBuilder, IDbSetBuilderParams, IIdBuilderBase, ITerminateIdBuilder, PropertyMap } from '../../../types/dbset-builder-types';
import { IdBuilder } from "../../builder/IdBuilder";

export class DefaultDbSetBuilder<
    TDocumentType extends string,
    TEntity extends IDbRecord<TDocumentType>,
    TExclusions extends keyof TEntity,
    TResult extends IDbSet<TDocumentType, TEntity, TExclusions>,
    TParams extends IDbSetBuilderParams<TDocumentType, TEntity, TExclusions, TResult>
> {
    protected _onCreate: (dbset: IDbSetBase<string>) => void;
    protected _params: TParams;
    protected InstanceCreator: new (props: IDbSetProps<TDocumentType, TEntity, TExclusions>) => TResult;

    protected _defaultExtend: (i: DbSetExtender<TDocumentType, TEntity, TExclusions>, args: IDbSetProps<TDocumentType, TEntity, TExclusions>) => TResult = (Instance, a) => new Instance(a) as any;

    constructor(onCreate: (dbset: IDbSetBase<TDocumentType>) => void, params: TParams, InstanceCreator: new (props: IDbSetProps<TDocumentType, TEntity, TExclusions>) => TResult) {
        this.InstanceCreator = InstanceCreator;
        this._params = params;
        this._onCreate = onCreate;
    }

    /**
     * Makes all entities returned from the underlying database readonly.  Entities cannot be updated, only adding or removing is available.
     * @returns DbSetBuilder
     */
    readonly() {
        this._params.readonly = true;
        return new DefaultDbSetBuilder<TDocumentType, Readonly<TEntity>, TExclusions, IDbSet<TDocumentType, Readonly<TEntity>, TExclusions>, TParams>(this._onCreate, this._params, this.InstanceCreator);
    }

    /**
     * Fluent API for building the documents key.  Key will be built in the order
     * keys are added
     * @param builder Fluent API
     * @returns DbSetBuilder
     */
    keys(builder: (b: IIdBuilderBase<TDocumentType, TEntity>) => (IChainIdBuilder<TDocumentType, TEntity> | ITerminateIdBuilder<TDocumentType, TEntity>)) {
        const idBuilder = new IdBuilder<TDocumentType, TEntity>();

        builder(idBuilder);

        this._params.idCreator = idBuilder.Creator;

        return new DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions, TResult, TParams>(this._onCreate, this._params, this.InstanceCreator);
    }

    /**
     * Set default separately for add and retrieval.  This is useful to retroactively add new properties
     * that are not nullable or to supply a default to an excluded property.  Default's will only be 
     * set when the property does not exist or is excluded
     * @param value Pick one or more properties and set their default value
     * @returns DbSetBuilder
     */
    defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity, TExclusions>): DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions, TResult, TParams>

    /**
     * Set default values for both add and retrieval of entities.  This is useful to retroactively add new properties
     * that are not nullable or to supply a default to an excluded property.  Default's will only be 
     * set when the property does not exist or is excluded
     * @param value Pick one or more properties and set their default value
     * @returns DbSetBuilder
     */
    defaults(value: DeepPartial<OmittedEntity<TEntity, TExclusions>>): DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions, TResult, TParams>
    defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity, TExclusions> | DeepPartial<OmittedEntity<TEntity, TExclusions>>) {

        if ("add" in value) {
            this._params.defaults = {
                ...this._params.defaults,
                add: { ...this._params.defaults.add, ...value.add }
            };
        }

        if ("retrieve" in value) {
            this._params.defaults = {
                ...this._params.defaults,
                retrieve: { ...this._params.defaults.retrieve, ...value.retrieve }
            };
        }

        if (!("retrieve" in value) && !("add" in value)) {
            this._params.defaults = {
                ...this._params.defaults,
                add: { ...this._params.defaults.add, ...value },
                retrieve: { ...this._params.defaults.retrieve, ...value },
            };
        }

        return new DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions, TResult, TParams>(this._onCreate, this._params, this.InstanceCreator);
    }

    /**
     * Exclude properties from the DbSet.add(). This is useful for defaults.  Properties can be excluded 
     * and default values can be set making it easier to add an entity.  Can be called one or many times to
     * exclude one or more properties
     * @param exclusions Property Exclusions
     * @returns DbSetBuilder
     */
    exclude<T extends keyof TEntity>(...exclusions: T[]) {
        this._params.exclusions.push(...exclusions);
        const params = this._params as IDbSetBuilderParams<TDocumentType, TEntity, T | TExclusions, IDbSet<TDocumentType, TEntity, T | TExclusions>>;
        const instanceCreator = this.InstanceCreator as new (props: IDbSetProps<TDocumentType, TEntity, T | TExclusions>) => IDbSet<TDocumentType, TEntity, T | TExclusions>;
        return new DefaultDbSetBuilder<TDocumentType, TEntity, T | TExclusions, IDbSet<TDocumentType, TEntity, T | TExclusions>, IDbSetBuilderParams<TDocumentType, TEntity, T | TExclusions, IDbSet<TDocumentType, TEntity, T | TExclusions>>>(this._onCreate, params, instanceCreator);
    }

    map<T extends keyof TEntity>(propertyMap: PropertyMap<TDocumentType, TEntity, T>) {
        this._params.map.push(propertyMap);
        return new DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions, TResult, TParams>(this._onCreate, this._params, this.InstanceCreator);
    }


    extend<TExtension extends IDbSet<TDocumentType, TEntity, TExclusions>>(extend: (i: new (props: IDbSetProps<TDocumentType, TEntity, TExclusions>) => TResult, args: IDbSetProps<TDocumentType, TEntity, TExclusions>) => TExtension) {
        this._params.extend.push(extend as any);

        const params: IDbSetBuilderParams<TDocumentType, TEntity, TExclusions, TExtension> = this._params as any;
        const instanceCreator: new (props: IDbSetProps<TDocumentType, TEntity, TExclusions>) => TExtension = this.InstanceCreator as any;
        return new DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions, TExtension, IDbSetBuilderParams<TDocumentType, TEntity, TExclusions, TExtension>>(this._onCreate, params, instanceCreator);
    }

    /**
     * Set a filter to be used on all queries
     * @param selector 
     * @returns DbSetBuilder
     */
    filter(selector: EntitySelector<TDocumentType, TEntity>) {
        this._params.filterSelector = selector;
        return new DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions, TResult, TParams>(this._onCreate, this._params, this.InstanceCreator);
    }

    hasChanged(comparison: EntityComparator<TDocumentType, TEntity>) {
        this._params.entityComparator = comparison;
        return new DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions, TResult, TParams>(this._onCreate, this._params, this.InstanceCreator); 
    }

    /**
     * Must call to fully create the DbSet.
     * @returns new DbSet
     */
    create(): TResult {

        const { extend, exclusions, ...rest } = this._params

        if (extend.length === 0) {
            extend.push(this._defaultExtend)
        }

        const result = extend.reduce((a: any, v, i) => v(i === 0 ? a : a.constructor, rest), this.InstanceCreator);

        this._onCreate(result);

        return result;
    }
}