import { DbSetPickDefaultActionOptional, DeepPartial, EntityComparator, EntitySelector } from "../../../types/common-types";
import { IDbSet, IDbSetProps, IDbSetBase } from "../../../types/dbset-types";
import { IDbRecord, OmittedEntity } from "../../../types/entity-types";
import { DbSetExtender, IChainIdBuilder, IDbSetBuilderParams, IIdBuilderBase, ITerminateIdBuilder, PropertyMap } from '../../../types/dbset-builder-types';
import { IdBuilder } from "../../builder/IdBuilder";

type DefaultDbSetBuilderOptions<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> = {
    onCreate: (dbset: IDbSetBase<TDocumentType>) => void;
    params: IDbSetBuilderParams<TDocumentType, TEntity, TExclusions>;
    InstanceCreator: new (props: IDbSetProps<TDocumentType, TEntity, TExclusions>) => IDbSet<TDocumentType, TEntity, TExclusions>;
}

export class DefaultDbSetBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {

    protected _onCreate: (dbset: IDbSetBase<string>) => void;
    protected _params: IDbSetBuilderParams<TDocumentType, TEntity, TExclusions>;
    protected InstanceCreator: new (props: IDbSetProps<TDocumentType, TEntity, TExclusions>) => IDbSet<TDocumentType, TEntity, TExclusions>;

    protected _defaultExtend: (i: DbSetExtender<TDocumentType, TEntity, TExclusions>, args: IDbSetProps<TDocumentType, TEntity, TExclusions>) => IDbSet<TDocumentType, TEntity, TExclusions> = (Instance, a) => new Instance(a) as any;

    constructor(options: DefaultDbSetBuilderOptions<TDocumentType, TEntity, TExclusions>) {
        const { InstanceCreator, onCreate, params } = options;
        this.InstanceCreator = InstanceCreator;
        this._params = params;
        this._onCreate = onCreate;
    }

    /**
     * Fluent API for building the documents key.  Key will be built in the order
     * keys are added
     * @param builder Fluent API
     * @returns DefaultDbSetBuilder
     */
    keys(builder: (b: IIdBuilderBase<TDocumentType, TEntity>) => (IChainIdBuilder<TDocumentType, TEntity> | ITerminateIdBuilder<TDocumentType, TEntity>)) {
        const idBuilder = new IdBuilder<TDocumentType, TEntity>();

        builder(idBuilder);

        this._params.idCreator = idBuilder.Creator;

        return new DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions>({
            InstanceCreator: this.InstanceCreator,
            onCreate: this._onCreate,
            params: this._params
        });
    }

    /**
     * Set default separately for add and retrieval.  This is useful to retroactively add new properties
     * that are not nullable or to supply a default to an excluded property.  Default's will only be 
     * set when the property does not exist or is excluded
     * @param value Pick one or more properties and set their default value
     * @returns DefaultDbSetBuilder
     */
    defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity, TExclusions>): DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions>

    /**
     * Set default values for both add and retrieval of entities.  This is useful to retroactively add new properties
     * that are not nullable or to supply a default to an excluded property.  Default's will only be 
     * set when the property does not exist or is excluded
     * @param value Pick one or more properties and set their default value
     * @returns DefaultDbSetBuilder
     */
    defaults(value: DeepPartial<OmittedEntity<TEntity, TExclusions>>): DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions>
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

        return new DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions>({
            InstanceCreator: this.InstanceCreator,
            onCreate: this._onCreate,
            params: this._params
        });
    }

    /**
     * Exclude properties from the DbSet.add(). This is useful for defaults.  Properties can be excluded 
     * and default values can be set making it easier to add an entity.  Can be called one or many times to
     * exclude one or more properties
     * @param exclusions Property Exclusions
     * @returns DefaultDbSetBuilder
     */
    exclude<T extends keyof TEntity>(...exclusions: T[]) {
        this._params.exclusions.push(...exclusions);
        const params = this._params as IDbSetBuilderParams<TDocumentType, TEntity, T | TExclusions>;
        const instanceCreator = this.InstanceCreator as new (props: IDbSetProps<TDocumentType, TEntity, T | TExclusions>) => IDbSet<TDocumentType, TEntity, T | TExclusions>;
        return new DefaultDbSetBuilder<TDocumentType, TEntity, T | TExclusions>({
            InstanceCreator: instanceCreator,
            onCreate: this._onCreate,
            params: params
        });
    }

    /**
     * Makes all entities returned from the underlying database readonly.  Entities cannot be updated, only adding or removing is available.
     * @returns DefaultDbSetBuilder
     */
    readonly() {
        this._params.readonly = true;
        return new DefaultDbSetBuilder<TDocumentType, Readonly<TEntity>, TExclusions>({
            InstanceCreator: this.InstanceCreator,
            onCreate: this._onCreate,
            params: this._params
        });
    }

    map<T extends keyof TEntity>(propertyMap: PropertyMap<TDocumentType, TEntity, T>) {
        this._params.map.push(propertyMap);
        return new DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions>({
            InstanceCreator: this.InstanceCreator,
            onCreate: this._onCreate,
            params: this._params
        });
    }

    /**
     * Set a filter to be used on all queries
     * @param selector 
     * @returns DefaultDbSetBuilder
     */
    filter(selector: EntitySelector<TDocumentType, TEntity>) {
        this._params.filterSelector = selector;
        return new DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions>({
            InstanceCreator: this.InstanceCreator,
            onCreate: this._onCreate,
            params: this._params
        });
    }

    /**
     * Returns an object of changed properties and their new values
     * @param comparison EntityComparator
     * @returns DefaultDbSetBuilder
     */
    getChanges(comparison: EntityComparator<TDocumentType, TEntity>) {
        this._params.entityComparator = comparison;
        return new DefaultDbSetBuilder<TDocumentType, TEntity, TExclusions>({
            InstanceCreator: this.InstanceCreator,
            onCreate: this._onCreate,
            params: this._params
        });
    }


    enhance<TEnhanced extends TEntity>(enhancer: (entity: TEntity) => TEnhanced) {
        const params: IDbSetBuilderParams<TDocumentType, TEnhanced, TExclusions> = this._params as any;

        params.enhancer = enhancer

        const instanceCreator: new (props: IDbSetProps<TDocumentType, TEnhanced, TExclusions>) => IDbSet<TDocumentType, TEnhanced, TExclusions> = this.InstanceCreator as any;

        return new DefaultDbSetBuilder<TDocumentType, TEnhanced, TExclusions>({
            InstanceCreator: instanceCreator,
            onCreate: this._onCreate,
            params: params
        });
    }

    /**
     * Must call to fully create the DbSet.
     * @returns new DbSet
     */
    create<TExtension extends IDbSet<TDocumentType, TEntity, TExclusions>>(extend?: (i: new (props: IDbSetProps<TDocumentType, TEntity, TExclusions>) => IDbSet<TDocumentType, TEntity, TExclusions>, args: IDbSetProps<TDocumentType, TEntity, TExclusions>) => TExtension) {

        const { exclusions, ...rest } = this._params

        if (extend != null) {
            return extend(this.InstanceCreator, {} as any)
        }

        const result = new this.InstanceCreator(rest);

        this._onCreate(result);

        return result;
    }
}