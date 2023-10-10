import { EntitySelector } from '../types/common-types';
import { DbSetStores, IStoreDbSet } from '../types/dbset-types';
import { IDbRecord, IDbRecordBase } from '../types/entity-types';
import { IDbPluginOptions } from '../types/plugin-types';
import { DataContext } from './DataContext';
import { nanoid } from 'nanoid';

export type ChangeHandler = (data: IDbRecordBase[]) => void
export type OnChangeHandlerDictionary = {
    [key: string]: { [key: string]: ChangeHandler },
}

const onChangeHandlers: OnChangeHandlerDictionary = {};

export class StoreDataContext<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase, TPluginOptions extends IDbPluginOptions = IDbPluginOptions> extends DataContext<TDocumentType, TEntityBase, TExclusions, TPluginOptions> {

    private _forEachStoreDbSet(callback: (dbset: IStoreDbSet<TDocumentType, TEntityBase>) => void | false) {
        for (const dbset of this) {
            if (dbset.types.dbsetType === "store") {

                if (callback(dbset as IStoreDbSet<TDocumentType, TEntityBase>) === false) {
                    return;
                }
                continue;
            }
        }
    }

    protected fireChangeEvents(documentType: TDocumentType, data: TEntityBase[]) {

        const handlers = Object.values<ChangeHandler>(onChangeHandlers[documentType] ?? {});

        for (const handler of handlers) {
            handler(data);
        }
    }

    addChangeEventListener(documentType: TDocumentType, callback: (data: TEntityBase[]) => void) {
        const id = nanoid();

        if (onChangeHandlers[documentType] == null) {
            onChangeHandlers[documentType] = {}
        }

        onChangeHandlers[documentType][id] = callback;

        return () => {
            delete onChangeHandlers[documentType][id];
        }
    }

    async hydrate() {
        const dbsets: IStoreDbSet<TDocumentType, TEntityBase>[] = [];

        this._forEachStoreDbSet(storeDbSet => {
            dbsets.push(storeDbSet);
        });

        await Promise.all(dbsets.map(w => w.hydrate()))
    }

    get store(): DbSetStores<TDocumentType, TEntityBase> {
        return {
            filter: (selector: EntitySelector<TDocumentType, TEntityBase>) => {

                const result: TEntityBase[] = [];

                this._forEachStoreDbSet(storeDbSet => {
                    const entities = storeDbSet.store.filter(selector);
                    result.push(...entities);
                });

                return result;
            },
            find: (selector: EntitySelector<TDocumentType, TEntityBase>): TEntityBase | undefined => {

                let result: TEntityBase | undefined = undefined;
                this._forEachStoreDbSet(storeDbSet => {
                    const found = storeDbSet.store.find(selector);

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
                    const all = storeDbSet.store.all()
                    result.push(...all);
                });

                return result;
            }
        }
    }
}