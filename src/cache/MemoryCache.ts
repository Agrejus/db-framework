class MemoryCache {

    private _data: { [id: string]: any } = {}

    put<T extends {}>(id: string, entity: Partial<T>) {

        const found = this.get<T>(id)

        if (found != null) {
            this._data[id] = { ...found, ...entity };
            return;
        }

        this._data[id] = entity;
    }

    remove(id: string) {
        delete this._data[id];
    }

    get<T extends {}>(id: string): T | null {
        return this._data[id] as T | null;
    }

    find<T extends {}>(selector: (entity: T, index?: number, array?: T[]) => boolean): T | undefined {
        return Object.values(this._data).find(selector)
    }

    filter<T extends {}>(selector: (entity: T, index?: number, array?: T[]) => boolean): T[] {
        return Object.values(this._data).filter(selector)
    }

    all<T extends {}>(): T[] {
        return Object.values(this._data);
    }
}

const memoryCache = new MemoryCache();

export { memoryCache };