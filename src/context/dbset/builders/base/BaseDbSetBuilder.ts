import { DbSetPickDefaultActionOptional, DeepPartial, EntityComparator, EntitySelector } from "../../../../types/common-types";
import { IDbSet, IDbSetProps, IDbSetBase } from "../../../../types/dbset-types";
import { IDbRecord, OmittedEntity } from "../../../../types/entity-types";
import { DbSetExtender, IChainIdBuilder, IDbSetBuilderParams, IIdBuilderBase, ITerminateIdBuilder, PropertyMap } from '../../../../types/dbset-builder-types';
import { IdBuilder } from "../../../builder/IdBuilder";

type DefaultDbSetBuilderOptions<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> = {
    onCreate: (dbset: IDbSetBase<TDocumentType>) => void;
    params: IDbSetBuilderParams<TDocumentType, TEntity, TExclusions>;
    InstanceCreator: new (props: IDbSetProps<TDocumentType, TEntity, TExclusions>) => IDbSet<TDocumentType, TEntity, TExclusions>;
}

type DbSetBuilderInstanceCreator<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TResult> = new (options: DefaultDbSetBuilderOptions<TDocumentType, TEntity, TExclusions>) => TResult

export class BaseDbSetBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {

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

    protected _keys<TResult>(builder: (b: IIdBuilderBase<TDocumentType, TEntity>) => (IChainIdBuilder<TDocumentType, TEntity> | ITerminateIdBuilder<TDocumentType, TEntity>), InstanceCreator: DbSetBuilderInstanceCreator<TDocumentType, TEntity, TExclusions, TResult>): TResult {
        const idBuilder = new IdBuilder<TDocumentType, TEntity>();

        builder(idBuilder);

        this._params.idCreator = idBuilder.Creator;

        return new InstanceCreator({
            InstanceCreator: this.InstanceCreator,
            onCreate: this._onCreate,
            params: this._params
        }) as TResult;
    }

    protected _defaults<TResult>(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity, TExclusions> | DeepPartial<OmittedEntity<TEntity, TExclusions>>, InstanceCreator: DbSetBuilderInstanceCreator<TDocumentType, TEntity, TExclusions, TResult>): TResult {

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

        return new InstanceCreator({
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
    protected _exclude<TResult, T extends keyof TEntity>(InstanceCreator: DbSetBuilderInstanceCreator<TDocumentType, TEntity, T | TExclusions, TResult>, ...exclusions: T[]) {
        this._params.exclusions.push(...exclusions);
        const params = this._params as IDbSetBuilderParams<TDocumentType, TEntity, T | TExclusions>;
        const instanceCreator = this.InstanceCreator as new (props: IDbSetProps<TDocumentType, TEntity, T | TExclusions>) => IDbSet<TDocumentType, TEntity, T | TExclusions>;
        return new InstanceCreator({
            InstanceCreator: instanceCreator,
            onCreate: this._onCreate,
            params: params
        });
    }

    /**
     * Makes all entities returned from the underlying database readonly.  Entities cannot be updated, only adding or removing is available.
     * @returns DefaultDbSetBuilder
     */
    protected _readonly<TResult>(InstanceCreator: DbSetBuilderInstanceCreator<TDocumentType, TEntity, TExclusions, TResult>) {
        this._params.readonly = true;
        return new InstanceCreator({
            InstanceCreator: this.InstanceCreator,
            onCreate: this._onCreate,
            params: this._params
        });
    }

    protected _map<T extends keyof TEntity, TResult>(propertyMap: PropertyMap<TDocumentType, TEntity, T>, InstanceCreator: DbSetBuilderInstanceCreator<TDocumentType, TEntity, TExclusions, TResult>) {
        this._params.map.push(propertyMap);
        return new InstanceCreator({
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
    protected _filter<TResult>(selector: EntitySelector<TDocumentType, TEntity>, InstanceCreator: DbSetBuilderInstanceCreator<TDocumentType, TEntity, TExclusions, TResult>) {
        this._params.filterSelector = selector;
        return new InstanceCreator({
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
    protected _getChanges<TResult>(comparison: EntityComparator<TDocumentType, TEntity>, InstanceCreator: DbSetBuilderInstanceCreator<TDocumentType, TEntity, TExclusions, TResult>) {
        this._params.entityComparator = comparison;
        return new InstanceCreator({
            InstanceCreator: this.InstanceCreator,
            onCreate: this._onCreate,
            params: this._params
        });
    }

    protected _enhance<TEnhanced extends TEntity, TResult>(enhancer: (entity: TEntity) => TEnhanced, InstanceCreator: DbSetBuilderInstanceCreator<TDocumentType, TEnhanced, TExclusions, TResult>) {
        const params: IDbSetBuilderParams<TDocumentType, TEnhanced, TExclusions> = this._params as any;

        params.enhancer = enhancer

        const instanceCreator: new (props: IDbSetProps<TDocumentType, TEnhanced, TExclusions>) => IDbSet<TDocumentType, TEnhanced, TExclusions> = this.InstanceCreator as any;

        return new InstanceCreator({
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


class Test<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends BaseDbSetBuilder<TDocumentType, TEntity, TExclusions>   {

    keys(builder: (b: IIdBuilderBase<TDocumentType, TEntity>) => IChainIdBuilder<TDocumentType, TEntity> | ITerminateIdBuilder<TDocumentType, TEntity>) {
        return super._keys<Test<TDocumentType, TEntity, TExclusions>>(builder, Test<TDocumentType, TEntity, TExclusions>);
    }

    defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity, TExclusions>): this
    defaults(value: DeepPartial<OmittedEntity<TEntity, TExclusions>>): this
    defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity, TExclusions> | DeepPartial<OmittedEntity<TEntity, TExclusions>>) {
        return super._defaults<Test<TDocumentType, TEntity, TExclusions>>(value, Test<TDocumentType, TEntity, TExclusions>);
    }

}

new Test({
    InstanceCreator: null as any,
    onCreate: null as any,
    params: null as any
}).keys;

