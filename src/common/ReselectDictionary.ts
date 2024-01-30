import { IDbRecord } from '../types/entity-types';
import { IAttachmentDictionary } from '../types/change-tracking-types';

export class ReselectDictionary<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> implements IAttachmentDictionary<TDocumentType, TEntity> {

    private _data: { [key in keyof TEntity]: TEntity } = {} as any;
    private _key: keyof TEntity;

    get length() {
        return Object.values(this._data).length;
    }

    constructor(key: keyof TEntity) {
        this._key = key;
    }

    map<T>(predicate: (value: TEntity, index: number, array: TEntity[]) => T): T[] {
        return Object.values<TEntity>(this._data).map(predicate)
    }

    all() {
        return Object.values(this._data);
    }

    concat(dictionary: IAttachmentDictionary<TDocumentType, TEntity>): IAttachmentDictionary<TDocumentType, TEntity> {
        const result = new ReselectDictionary<TDocumentType, TEntity>(this._key);

        result.put(...this.all());
        result.put(...dictionary.all());

        return result;
    }

    forEach(callback: (key: string, items: TEntity) => void) {
        for(const key in this._data) {
            callback(key, this._data[key])
        }
    }

    includes(key: keyof TEntity) {
        return this._data[key] != null;
    }

    put(...items: TEntity[]) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const key: keyof TEntity = items[i][this._key] as any;

            this._data[key] = item;
        }
    }

    get(id: keyof TEntity) {
        return this._data[id];
    }

    has(id: keyof TEntity) {
        return this._data[id] != null;
    }

    removeById(...items: (keyof TEntity)[]): void {
        for (let i = 0; i < items.length; i++) {
            const id = items[i];
            delete this._data[id];
        }
    }

    remove(...entities: TEntity[]) {
        const ids = entities.map(w => w[this._key] as keyof TEntity)
        this.removeById(...ids)
    }

    filter(predicate: (value: TEntity, index: number, array: TEntity[]) => boolean): TEntity[] {
        return Object.values<TEntity>(this._data).filter(predicate)
    }
}