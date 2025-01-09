const store = new Map<string, any>();

export const cache = {
    resolve: function<T>(key: string, fetcher: () => T): T {
        if (store.has(key)) {
            return store.get(key) as T;
        }

        const value = fetcher();

        store.set(key, value);

        return value;
    }
}