import { IDbRecord } from "../types/entity-types";

export class CacheDataStore<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {

    private _data: { [id: string]: TEntity };

    constructor() {
        this._data = {};
    }

    put(entity: TEntity) {
        this._data[entity._id] = entity;
    }

    putMany(...entities: TEntity[]) {
        for (const entity of entities) {
            this.put(entity)
        }
    }

    remove(entity: TEntity) {
        delete this._data[entity._id];
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