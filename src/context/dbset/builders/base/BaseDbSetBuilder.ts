import { DbSetPickDefaultActionOptional, DeepPartial, EntityComparator, EntitySelector, ToUnion } from "../../../../types/common-types";
import { IDbSet, IDbSetProps, IDbSetBase } from "../../../../types/dbset-types";
import { IDbRecord, OmittedEntity } from "../../../../types/entity-types";
import { DbSetExtender, IChainIdBuilder, IDbSetBuilderParams, IIdBuilderBase, ITerminateIdBuilder, PropertyMap } from '../../../../types/dbset-builder-types';
import { IdBuilder } from "../../../builder/IdBuilder";

type DefaultDbSetBuilderOptions<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TParams extends IDbSetBuilderParams<TDocumentType, TEntity, TExclusions>> = {
    onCreate: (dbset: IDbSetBase<TDocumentType>) => void;
    params: TParams;
    InstanceCreator: new (props: IDbSetProps<TDocumentType, TEntity, TExclusions>) => IDbSet<TDocumentType, TEntity, TExclusions>;
}

type DbSetBuilderInstanceCreator<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TParams extends IDbSetBuilderParams<TDocumentType, TEntity, TExclusions>, TResult> = new (options: DefaultDbSetBuilderOptions<TDocumentType, TEntity, TExclusions, TParams>) => TResult

export class BaseDbSetBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TParams extends IDbSetBuilderParams<TDocumentType, TEntity, TExclusions> = IDbSetBuilderParams<TDocumentType, TEntity, TExclusions>> {

    protected _onCreate: (dbset: IDbSetBase<string>) => void;
    protected _params: TParams;
    protected InstanceCreator: new (props: IDbSetProps<TDocumentType, TEntity, TExclusions>) => IDbSet<TDocumentType, TEntity, TExclusions>;

    protected _defaultExtend: (i: DbSetExtender<TDocumentType, TEntity, TExclusions>, args: IDbSetProps<TDocumentType, TEntity, TExclusions>) => IDbSet<TDocumentType, TEntity, TExclusions> = (Instance, a) => new Instance(a) as any;

    constructor(options: DefaultDbSetBuilderOptions<TDocumentType, TEntity, TExclusions, TParams>) {
        const { InstanceCreator, onCreate, params } = options;
        this.InstanceCreator = InstanceCreator;
        this._params = params;
        this._onCreate = onCreate;
    }

    protected _keys<TResult>(builder: (b: IIdBuilderBase<TDocumentType, TEntity>) => (IChainIdBuilder<TDocumentType, TEntity> | ITerminateIdBuilder<TDocumentType, TEntity>), InstanceCreator: DbSetBuilderInstanceCreator<TDocumentType, TEntity, TExclusions, TParams, TResult>): TResult {
        const idBuilder = new IdBuilder<TDocumentType, TEntity>();

        builder(idBuilder);

        this._params.idCreator = idBuilder.Creator;

        return new InstanceCreator({
            InstanceCreator: this.InstanceCreator,
            onCreate: this._onCreate,
            params: this._params
        }) as TResult;
    }

    protected _defaults<TResult>(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity, TExclusions> | DeepPartial<OmittedEntity<TEntity, TExclusions>>, InstanceCreator: DbSetBuilderInstanceCreator<TDocumentType, TEntity, TExclusions, TParams, TResult>): TResult {

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

    protected _exclude<TResult, T extends keyof TEntity>(InstanceCreator: DbSetBuilderInstanceCreator<TDocumentType, TEntity, T | TExclusions, IDbSetBuilderParams<TDocumentType, TEntity, T | TExclusions>, TResult>, ...exclusions: T[]) {
        this._params.exclusions.push(...exclusions);
        const params = this._params as IDbSetBuilderParams<TDocumentType, TEntity, T | TExclusions>;
        const instanceCreator = this.InstanceCreator as new (props: IDbSetProps<TDocumentType, TEntity, T | TExclusions>) => IDbSet<TDocumentType, TEntity, T | TExclusions>;
        return new InstanceCreator({
            InstanceCreator: instanceCreator,
            onCreate: this._onCreate,
            params: params
        });
    }

    protected _readonly<TResult>(InstanceCreator: DbSetBuilderInstanceCreator<TDocumentType, TEntity, TExclusions, TParams, TResult>) {
        this._params.readonly = true;
        return new InstanceCreator({
            InstanceCreator: this.InstanceCreator,
            onCreate: this._onCreate,
            params: this._params
        });
    }

    protected _map<T extends keyof TEntity, TResult>(propertyMap: PropertyMap<TDocumentType, TEntity, T>, InstanceCreator: DbSetBuilderInstanceCreator<TDocumentType, TEntity, TExclusions, TParams, TResult>) {
        this._params.map.push(propertyMap);
        return new InstanceCreator({
            InstanceCreator: this.InstanceCreator,
            onCreate: this._onCreate,
            params: this._params
        });
    }

    protected _filter<TResult>(selector: EntitySelector<TDocumentType, TEntity>, InstanceCreator: DbSetBuilderInstanceCreator<TDocumentType, TEntity, TExclusions, TParams, TResult>) {
        this._params.filterSelector = selector;
        return new InstanceCreator({
            InstanceCreator: this.InstanceCreator,
            onCreate: this._onCreate,
            params: this._params
        });
    }

    protected _getChanges<TResult>(comparison: EntityComparator<TDocumentType, TEntity>, InstanceCreator: DbSetBuilderInstanceCreator<TDocumentType, TEntity, TExclusions, TParams, TResult>) {
        this._params.entityComparator = comparison;
        return new InstanceCreator({
            InstanceCreator: this.InstanceCreator,
            onCreate: this._onCreate,
            params: this._params
        });
    }

    protected _enhance<TEnhanced, TResult>(enhancer: (entity: TEntity) => TEnhanced, InstanceCreator: DbSetBuilderInstanceCreator<TDocumentType, TEntity & TEnhanced, TExclusions | ToUnion<TEnhanced>, IDbSetBuilderParams<TDocumentType, TEntity & TEnhanced, TExclusions | ToUnion<TEnhanced>>, TResult>) {
        const params: IDbSetBuilderParams<TDocumentType, TEntity & TEnhanced, TExclusions | ToUnion<TEnhanced>> = this._params as any;

        params.enhancer = enhancer as any

        const instanceCreator: new (props: IDbSetProps<TDocumentType, TEntity & TEnhanced, TExclusions | ToUnion<TEnhanced>>) => IDbSet<TDocumentType, TEntity & TEnhanced, TExclusions | ToUnion<TEnhanced>> = this.InstanceCreator as any;

        return new InstanceCreator({
            InstanceCreator: instanceCreator,
            onCreate: this._onCreate,
            params: params
        });
    }


    // overload to fix this
    // db set creator static method so we can create them in a new file?
    /**
     * Must call to fully create the DbSet.
     * @returns new DbSet
     */
    create<TExtension extends IDbSet<TDocumentType, TEntity, TExclusions>>() : IDbSet<TDocumentType, TEntity, TExclusions>;
    create<TExtension extends IDbSet<TDocumentType, TEntity, TExclusions>>(extend?: (i: new (props: IDbSetProps<TDocumentType, TEntity, TExclusions>) => IDbSet<TDocumentType, TEntity, TExclusions>, args: IDbSetProps<TDocumentType, TEntity, TExclusions>) => TExtension) : TExtension
    create<TExtension extends IDbSet<TDocumentType, TEntity, TExclusions>>(extend?: (i: new (props: IDbSetProps<TDocumentType, TEntity, TExclusions>) => IDbSet<TDocumentType, TEntity, TExclusions>, args: IDbSetProps<TDocumentType, TEntity, TExclusions>) => TExtension) {

        const { exclusions, ...rest } = this._params

        if (extend != null) {
            const extendedResult = extend(this.InstanceCreator, rest);

            this._onCreate(extendedResult);

            return extendedResult;
        }

        const result = new this.InstanceCreator(rest);

        this._onCreate(result);

        return result;
    }
}