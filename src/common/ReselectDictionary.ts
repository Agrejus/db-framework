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

    forEach(callback: (key: string, items: TEntity) => void) {
        for(const key in this._data) {
            callback(key, this._data[key])
        }
    }

    includes(key: keyof TEntity) {
        return this._data[key] != null;
    }

    push(...items: TEntity[]) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const key: keyof TEntity = items[i][this._key] as any;

            this._data[key] = item;
        }
    }

    get(...entities: TEntity[]) {
        const result: TEntity[] = [];

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const key: keyof TEntity = entity[this._key] as any;
            const item = this._data[key];

            if (item != null) {
                result.push(item);
            }
        }

        return result;
    }

    remove(...entities: TEntity[]) {
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const key: keyof TEntity = entity[this._key] as any;
            delete this._data[key];
        }
    }

    filter(predicate: (value: TEntity, index: number, array: TEntity[]) => boolean): TEntity[] {
        return Object.values<TEntity>(this._data).filter(predicate)
    }
}