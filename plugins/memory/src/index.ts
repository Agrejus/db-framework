import { DbCollection } from './DbCollection';
import { MemoryPlugin } from './MemoryPlugin';

export type MemoryDatabase = Record<string, DbCollection>;

export const assertIsMemoryPlugin = (value: unknown): asserts value is MemoryPlugin => {
    if (value instanceof MemoryPlugin) {
        return;
    }

    throw new TypeError(`Value is not instance of type MemoryPlugin`);
}

export { MemoryPlugin } 