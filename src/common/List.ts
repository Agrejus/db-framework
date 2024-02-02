import { IList } from '../types/change-tracking-types';
import { ReadOnlyList } from './ReadOnlyList';

export class List<T> extends ReadOnlyList<T> implements IList<T> {

    constructor(key: keyof T) {
        super(key);
    }
    
    concat(dictionary: IList<T>): IList<T> {
        const result = new List<T>(this.key);

        result.put(...this.all());
        result.put(...dictionary.all());

        return result;
    }

    put(...items: T[]) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const key: keyof T = items[i][this.key] as any;

            this.data[key] = item;
        }
    }
}