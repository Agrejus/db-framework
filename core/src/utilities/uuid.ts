export const uuid = (length: number = 16): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'; // Base64 character set
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

const HEX_CHARS = '0123456789abcdef';
const UUID_TEMPLATE = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

const hasCrypto =
    typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function';

export const uuidv4 = (): string => {
    let randomBytes: Uint8Array | null = null;
    if (hasCrypto) {
        randomBytes = crypto.getRandomValues(new Uint8Array(16));
    }

    let byteIndex = 0;
    let uuid = '';

    for (let i = 0; i < UUID_TEMPLATE.length; i++) {
        const c = UUID_TEMPLATE[i];
        if (c === '-') {
            uuid += '-';
            continue;
        }

        let r: number;
        if (hasCrypto && randomBytes) {
            // Each byte gives two hex digits (nibbles)
            r =
                (i % 2 === 0
                    ? randomBytes[byteIndex] >> 4
                    : randomBytes[byteIndex++] & 0x0f);
        } else {
            r = Math.floor(Math.random() * 16);
        }

        if (c === 'x') {
            uuid += HEX_CHARS[r];
        } else if (c === 'y') {
            // Variant bits: 8, 9, A, or B
            uuid += HEX_CHARS[(r & 0x3) | 0x8];
        } else if (c === '4') {
            uuid += '4';
        }
    }

    return uuid;
};
