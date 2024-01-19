import { generateRandomId } from '../common/helpers';
import { EntitySelector } from '../types/common-types';
import { ContextOptions } from '../types/context-types';
import { DbSetChanges, IDataContextState, IStatefulDbSet } from '../types/dbset-types';
import { IDbRecord } from '../types/entity-types';
import { DbPluginInstanceCreator, IDbPlugin, IDbPluginOptions } from '../types/plugin-types';
import { DataContext } from './DataContext';
import { StatefulDbSetInitializer } from './dbset/builders/StatefulDbSetInitializer';

export type ChangeHandler = <TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>>(data: DbSetChanges<TDocumentType, TEntityBase>) => void
export type OnChangeHandlerDictionary = {
    [key: string]: { [key: string]: ChangeHandler }
}

const onChangeHandlers: OnChangeHandlerDictionary = {};

export abstract class StatefulDataContext<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase, TPluginOptions extends IDbPluginOptions = IDbPluginOptions, TDbPlugin extends IDbPlugin<TDocumentType, TEntityBase, TExclusions> = IDbPlugin<TDocumentType, TEntityBase, TExclusions>> extends DataContext<TDocumentType, TEntityBase, TExclusions, TPluginOptions, TDbPlugin> {

    constructor(options: TPluginOptions, Plugin: DbPluginInstanceCreator<TDocumentType, TEntityBase, TExclusions, TDbPlugin>, contextOptions: ContextOptions = { environment: "development" }) {
        super(options, Plugin, contextOptions)
    }

    private _forEachStoreDbSet(callback: (dbset: IStatefulDbSet<TDocumentType, TEntityBase>) => void | false) {
        for (const dbset of this) {
            if (dbset.types.dbsetType === "stateful") {

                if (callback(dbset as any) === false) {
                    return;
                }
                continue;
            }
        }
    }

    protected fireChangeEvents(documentType: TDocumentType, data: DbSetChanges<TDocumentType, TEntityBase>) {

        const handlers = Object.values<ChangeHandler>(onChangeHandlers[documentType] ?? {});

        for (const handler of handlers) {
            handler(data);
        }
    }

    addChangeEventListener(documentType: TDocumentType, callback: ChangeHandler) {
        const id = generateRandomId();

        if (onChangeHandlers[documentType] == null) {
            onChangeHandlers[documentType] = {}
        }

        onChangeHandlers[documentType][id] = callback;

        return () => {
            delete onChangeHandlers[documentType][id];
        }
    }

    removeAllEventListeners() {
        for (const documentType in onChangeHandlers) {
            delete onChangeHandlers[documentType];
        }
    }

    protected override dbset(): StatefulDbSetInitializer<TDocumentType, TEntityBase, TExclusions, TPluginOptions> {
        return new StatefulDbSetInitializer<TDocumentType, TEntityBase, TExclusions, TPluginOptions>(this.addDbSet.bind(this), this);
    }

    async hydrate() {
        const dbsets: IStatefulDbSet<TDocumentType, TEntityBase>[] = [];

        this._forEachStoreDbSet(storeDbSet => {
            dbsets.push(storeDbSet);
        });

        await Promise.all(dbsets.map(w => w.hydrate()))
    }

    protected override async onSaveError() {
        const dbsets: IStatefulDbSet<TDocumentType, any>[] = [];
        for (const dbset of this) {
            if (dbset.types.dbsetType === "stateful") {
                dbsets.push(dbset as any);
                continue;
            }
        }

        await Promise.all(dbsets.map(w => w.hydrate()))
    }

    get state(): IDataContextState<TDocumentType, TEntityBase> {
        return {
            filter: (selector: EntitySelector<TDocumentType, TEntityBase>) => {

                const result: TEntityBase[] = [];

                this._forEachStoreDbSet(storeDbSet => {
                    const entities = storeDbSet.state.filter(selector);
                    result.push(...entities);
                });

                return result;
            },
            find: (selector: EntitySelector<TDocumentType, TEntityBase>): TEntityBase | undefined => {

                let result: TEntityBase | undefined = undefined;
                this._forEachStoreDbSet(storeDbSet => {
                    const found = storeDbSet.state.find(selector);

                    if (found != null) {
                        result = found
                        return false;
                    }
                });

                return result;
            },
            all: () => {
                const result: TEntityBase[] = [];

                this._forEachStoreDbSet(storeDbSet => {
                    const all = storeDbSet.state.all()
                    result.push(...all);
                });

                return result;
            }
        }
    }
}