import { DbPlugin, IDbPluginOptions, IBulkOperationsResponse, IQueryParams, Transactions } from '@agrejus/db-framework';
import { LocalStorageDbRecord } from './types';

declare var window: {
    localStorage: {
        clear: () => void,
        setItem: (key: string, value: string) => void;
        getItem: <T extends any>(key: string) => T;
        removeItem: (key: string) => void;
    }
};

export class LocalStorageDbPlugin<TDocumentType extends string, TEntityBase extends LocalStorageDbRecord<TDocumentType>, TDbPluginOptions extends IDbPluginOptions = IDbPluginOptions> extends DbPlugin<TDocumentType, TEntityBase, "id" | "rev"> {

    override identifier: keyof TEntityBase = "rev";
    override idPropertyName: keyof TEntityBase = "id";
    override types: { exclusions: 'id' | 'rev'; };

    private _key = "db-framework-local-storage";

    async destroy() {
        localStorage.clear()
    }

    private _getData() {
        return JSON.parse(localStorage.getItem(this._key) ?? "{}") as { [key in keyof TEntityBase]: TEntityBase }
    }

    async all(payload?: IQueryParams<TDocumentType>) {
        const data = this._getData();
        const entities = Object.values(data);

        if (payload?.DocumentType != null) {
            return entities.filter(w => w.DocumentType === payload.DocumentType);
        }

        return entities;
    }

    async get(_: TDocumentType, ...ids: string[]): Promise<TEntityBase[]> {
        const data = await this.all();
        return data.filter(w => ids.includes(w[this.idPropertyName] as string));
    }

    async bulkOperations(operations: { adds: TEntityBase[]; removes: TEntityBase[]; updates: TEntityBase[]; }, transactions: Transactions): Promise<IBulkOperationsResponse> {
        const { adds, removes, updates } = operations;
        const result: IBulkOperationsResponse = {
            errors: {},
            errors_count: 0,
            successes: {},
            successes_count: 0
        }

        const data = this._getData();

        for (const add of adds) {
            const id = add[this.idPropertyName] as keyof TEntityBase;
            const newRev = `${1}-${Date.now()}`;
            data[id] = { ...add, [this.identifier]: newRev };

            result.successes_count++;
            result.successes[id as string] = {
                id: id as string,
                ok: true,
                rev: newRev
            }
        }

        for(const update of updates) {

            const id = update[this.idPropertyName] as keyof TEntityBase;
            const existingRev = String(data[id][this.identifier]);

            try {
                const existingRevNumber = Number(existingRev.substring(0, existingRev.length - 1));
                data[id] = { ...update, [this.identifier]: `${(existingRevNumber + 1)}-${Date.now()}` };
            } catch (e: any) {
                result.errors_count++;
                result.errors[id as string] = {
                    id: id as string,
                    ok: false,
                    rev: existingRev,
                    error: e
                }
            }
        }

        for(const remove of removes) {
            const id = remove[this.idPropertyName] as keyof TEntityBase;
            delete data[id];
        }

        localStorage.setItem(this._key, JSON.stringify(data));

        return result;
    }

    enrichGenerated(response: IBulkOperationsResponse, entity: TEntityBase): TEntityBase {
        const found = response.successes[entity.id];

        if (found && found.ok === true) {
            return { ...entity, rev: found.rev }
        }

        return entity;
    }
}