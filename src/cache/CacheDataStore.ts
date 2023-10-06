import { IDbRecord } from "../types/entity-types";

export class CacheDataStore<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {

    private _data: { [id: string]: TEntity };
    private _idPropertyName: keyof TEntity

    constructor(idPropertyName: keyof TEntity) {
        this._data = {};
        this._idPropertyName = idPropertyName;
    }

    put(entity: TEntity) {
        const id = entity[this._idPropertyName] as string;
        this._data[id] = entity;
    }

    putMany(...entities: TEntity[]) {
        for (const entity of entities) {
            this.put(entity)
        }
    }

    remove(entity: TEntity) {
        const id = entity[this._idPropertyName] as string;
        delete this._data[id];
    }

    removeMany(...entities: TEntity[]) {
        for (const entity of entities) {
            this.remove(entity)
        }
    }

    get(id: string): TEntity | null {
        return this._data[id] as TEntity | null;
    }

    find(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): TEntity | undefined {
        return Object.values(this._data).find(selector)
    }

    filter(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): TEntity[] {
        return Object.values(this._data).filter(selector)
    }

    all(): TEntity[] {
        return Object.values(this._data);
    }
}