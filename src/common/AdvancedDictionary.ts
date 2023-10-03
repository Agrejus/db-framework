import { IDbRecord, IIndexableEntity } from '../types/entity-types';
import { IAttachmentDictionary } from '../types/change-tracking-types';

export class AdvancedDictionary<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> implements IAttachmentDictionary<TDocumentType, TEntity> {

    private _data: IIndexableEntity<TEntity[]> = {};
    private _key: string;
    private _enumeration: TEntity[] = [];
    private _length: number = 0;

    get length() {
        return this._length;
    }

    constructor(key: keyof TEntity) {
        this._key = key as string
    }

    forEach(callback: (key: string, items: TEntity[]) => void) {
        for(const key in this._data) {
            callback(key, this._data[key])
        }
    }

    push(...items: TEntity[]) {
        for (let i = 0; i < items.length; i++) {
            const item: IIndexableEntity = items[i];
            const key = item[this._key];

            if (!this._data[key]) {
                this._data[key] = [];
            }

            this._data[key].push(item as TEntity);
        }

        this._length += items.length;
        this._enumeration = [];
    }

    get(...entities: TEntity[]) {
        const result: TEntity[] = [];

        for (let i = 0; i < entities.length; i++) {
            const entity: IIndexableEntity = entities[i];
            const key = entity[this._key];
            const items = this._data[key];

            if (items != null) {
                result.push(...items);
            }
        }

        return result;
    }

    remove(...entities: TEntity[]) {
        for (let i = 0; i < entities.length; i++) {
            const entity: IIndexableEntity = entities[i];
            const key = entity[this._key];
            delete this._data[key];
        }
        this._length -= entities.length;
        this._enumeration = [];
    }

    filter(predicate: (value: TEntity, index: number, array: TEntity[]) => boolean): TEntity[] {

        if (this._enumeration.length === 0) {
            for (let key in this._data) {
                const data = this._data[key];
                this._enumeration.push(...data);
            }
        }

        return this._enumeration.filter(predicate);
    }
}