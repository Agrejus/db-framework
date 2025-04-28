export const uuid = (length: number = 16): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'; // Base64 character set
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

// UUID v4 template parts for optimization
const UUID_TEMPLATE_PARTS = ['xxxxxxxx', 'xxxx', '4xxx', 'yxxx', 'xxxxxxxxxxxx'];
const HEX_CHARS = '0123456789abcdef';

/**
 * Generates a RFC4122 compliant UUID v4 with performance optimizations
 * @returns A properly formatted UUID v4 string
 */
export const uuidv4 = (): string => {
    // Check for crypto support once
    const hasCrypto = typeof crypto !== 'undefined' && crypto.getRandomValues;

    // Pre-allocate a buffer for all the random values we'll need
    // We need 16 bytes (128 bits) for a UUID
    const randomBytes = hasCrypto ? crypto.getRandomValues(new Uint8Array(16)) : null;

    let uuid = '';
    let bytePos = 0;

    // Process each template part
    for (let partIndex = 0; partIndex < UUID_TEMPLATE_PARTS.length; partIndex++) {
        if (partIndex > 0) {
            uuid += '-'; // Add hyphen between parts
        }

        const part = UUID_TEMPLATE_PARTS[partIndex];
        for (let i = 0; i < part.length; i++) {
            const c = part[i];

            let r;
            if (hasCrypto) {
                r = randomBytes![bytePos] % 16;
                // Use each byte for two hex characters
                bytePos = (i & 1) ? bytePos + 1 : bytePos;
            } else {
                r = Math.floor(Math.random() * 16);
            }

            // Direct character lookup instead of toString(16)
            if (c === 'x') {
                uuid += HEX_CHARS[r];
            } else if (c === 'y') {
                // Variant bits - must be one of 8, 9, A, or B
                uuid += HEX_CHARS[r & 0x3 | 0x8];
            } else if (c === '4') {
                // Version 4 - just add '4'
                uuid += '4';
            }
        }
    }

    return uuid;
};