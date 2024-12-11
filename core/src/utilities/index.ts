export const toMap = <T extends {}>(data: T[], keySelector: (item: T) => T[keyof T] | string) => {

    const result = new Map<T[keyof T] | string, T>();
    
    for(let i = 0; i < data.length; i++) {
        const item = data[i];
        const key = keySelector(item);
        result.set(key, item);
    }

    return result;
}

export const createUUID = (length: number = 16) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'; // Base64 character set
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

export const hash = (value: string, seed: number = 0) => {
    // From Stack Overflow
    // https://stackoverflow.com/a/52171480/3329760
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;

    for (let i = 0, ch: number; i < value.length; i++) {
        ch = value.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }

    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};