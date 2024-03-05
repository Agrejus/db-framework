import { toDictionary } from "./helpers";

export class ReadOnlyList<T> {

    protected readonly data: { [key in keyof T]: T } = {} as any;
    protected readonly key: keyof T;

    get length() {
        return Object.values(this.data).length;
    }

    constructor(key: keyof T, data: T[] = []) {
        this.key = key;
        this.data = toDictionary(data, key) as { [key in keyof T]: T };
    }

    map<TResult>(predicate: (value: T, index: number, array: T[]) => TResult): TResult[] {

        const values = Object.values(this.data) as T[];
        return values.map(predicate)
    }

    all() {
        return Object.values(this.data) as T[];
    }

    forEach(callback: (key: string | number, items: T) => void) {
        for (const key in this.data) {
            callback(key, this.data[key])
        }
    }

    includes(key: keyof T) {
        return this.data[key] != null;
    }

    get(id: keyof T) {
        return this.data[id];
    }

    has(id: keyof T) {
        return this.data[id] != null;
    }

    removeById(...items: (keyof T)[]): void {
        for (let i = 0; i < items.length; i++) {
            const id = items[i];
            delete this.data[id];
        }
    }

    match<TMatch extends { [key: string | number]: any }>(...entities: TMatch[]) {
        const result: (TMatch | undefined)[] = [];

        for (const entity of entities) {
            const id: keyof T = entity[this.key as string | number] as any;
            const found: TMatch | undefined = this.data[id] as any

            if (found != null) {
                result.push(found);
            }
        }

        return result;
    }

    remove(...entities: T[]) {
        const ids = entities.map(w => w[this.key] as keyof T)
        this.removeById(...ids)
    }

    filter(predicate: (value: T, index: number, array: T[]) => boolean): T[] {
        return Object.values<T>(this.data).filter(predicate)
    }
}