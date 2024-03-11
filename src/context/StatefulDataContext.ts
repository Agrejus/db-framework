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
    [documentType: string]: {
        [eventId: string]: {
            documentType: string;
            filter?: (entity: any) => boolean;
            hander: ChangeHandler;
        }
    }
}
const onChangeHandlers: OnChangeHandlerDictionary = {};

export abstract class StatefulDataContext<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase, TPluginOptions extends IDbPluginOptions = IDbPluginOptions, TDbPlugin extends IDbPlugin<TDocumentType, TEntityBase, TExclusions> = IDbPlugin<TDocumentType, TEntityBase, TExclusions>> extends DataContext<TDocumentType, TEntityBase, TExclusions, TPluginOptions, TDbPlugin> {

    constructor(options: TPluginOptions, Plugin: DbPluginInstanceCreator<TDocumentType, TEntityBase, TExclusions, TDbPlugin>, contextOptions: ContextOptions = { environment: "development" }) {
        super(options, Plugin, contextOptions)
    }

    private _forEachStoreDbSet(callback: (dbset: IStatefulDbSet<TDocumentType, TEntityBase, TExclusions, TDbPlugin>) => void | false) {
        for (const dbset of this.dbsets.all()) {
            if (dbset.types.dbsetType === "stateful") {

                if (callback(dbset as any) === false) {
                    return;
                }
                continue;
            }
        }
    }

    protected fireChangeEvents(documentType: TDocumentType, data: DbSetChanges<TDocumentType, TEntityBase>) {

        const items = Object.values<{ documentType: string, filter?: (entity: any) => boolean, hander: ChangeHandler }>(onChangeHandlers[documentType] ?? {});

        for (const item of items) {
            setTimeout(() => {

                if (item.filter != null) {
                    const adds = data.adds.filter(item.filter);
                    const all = data.all.filter(item.filter);
                    const removes = data.removes.filter(item.filter);
                    const updates = data.updates.filter(item.filter);

                    if (adds.length > 0 || all.length > 0 || removes.length > 0 || updates.length > 0) {
                        item.hander({ adds, all, removes, updates })
                    }
                    return
                }

                item.hander(data)
            }, 0);
        }
    }

    addChangeEventListener(documentType: TDocumentType, callback: ChangeHandler): () => void;
    addChangeEventListener(documentType: TDocumentType, filter: (entities: TEntityBase[]) => boolean, callback: ChangeHandler): () => void;
    addChangeEventListener(documentType: TDocumentType, filterOrCallback: ((entities: TEntityBase[]) => boolean) | ChangeHandler, callback?: ChangeHandler) {
        const id = generateRandomId();

        if (onChangeHandlers[documentType] == null) {
            onChangeHandlers[documentType] = {}
        }

        if (callback == null) {

            onChangeHandlers[documentType][id] = {
                documentType,
                hander: filterOrCallback as ChangeHandler,
            }

            return () => {
                delete onChangeHandlers[id];
            }
        }

        onChangeHandlers[documentType][id] = {
            documentType,
            filter: filterOrCallback as ((entities: TEntityBase[]) => boolean),
            hander: callback as ChangeHandler,
        }

        return () => {
            delete onChangeHandlers[id];
        }
    }

    removeAllEventListeners() {
        for (const documentType in onChangeHandlers) {
            delete onChangeHandlers[documentType];
        }
    }

    protected override dbset(): StatefulDbSetInitializer<TDocumentType, TEntityBase, TExclusions, TPluginOptions, TDbPlugin> {
        return new StatefulDbSetInitializer<TDocumentType, TEntityBase, TExclusions, TPluginOptions, TDbPlugin>(this.addDbSet.bind(this), this);
    }

    async hydrate() {
        const dbsets: IStatefulDbSet<TDocumentType, TEntityBase, TExclusions, TDbPlugin>[] = [];

        this._forEachStoreDbSet(storeDbSet => {
            dbsets.push(storeDbSet);
        });

        await Promise.all(dbsets.map(w => w.hydrate()))
    }

    protected override async onSaveError() {
        const dbsets: IStatefulDbSet<TDocumentType, any, TExclusions, TDbPlugin>[] = [];
        for (const dbset of this.dbsets.all()) {
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