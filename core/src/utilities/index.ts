export const toMap = <T extends {}>(data: T[], keySelector: (item: T) => T[keyof T] | string) => {

    const result = new Map<T[keyof T] | string, T>();

    for (let i = 0; i < data.length; i++) {
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

/**
 * Formats a JavaScript function string.
 * @param {string} codeString - The function as a string.
 * @returns {string} - A formatted version of the function string.
 */
export function formatFunctionString(codeString: string) {
    // Regular expression patterns for basic formatting
    const patterns = [
        { regex: /\s*{\s*/g, replacement: " {\n" }, // Open curly brace: new line
        { regex: /\s*}\s*/g, replacement: "\n}" }, // Close curly brace: new line
        { regex: /\s*;\s*/g, replacement: ";\n" }, // Semicolons: new line
        { regex: /\s*\(\s*/g, replacement: " (" }, // Space before open parenthesis
        { regex: /\s*\)\s*/g, replacement: ") " }, // Space after close parenthesis
        { regex: /\b(if|else|for|while|function|return)\b/g, replacement: "$1" }, // Fix spacing
        { regex: /([^\n])\s*\bif\b/g, replacement: "$1\nif" }, // Ensure 'if' starts on a new line
        { regex: /([^\n])\s*\blet\b/g, replacement: "$1\nlet" },
        { regex: /([^\n])\s*\bconst\b/g, replacement: "$1\nconst" },
        { regex: /\s*=\s*/g, replacement: " = " }, // Spaces around equals
        { regex: /\s*([+\-*/<>&|!])\s*/g, replacement: " $1 " }, // Spaces around operators
        { regex: /\n\s*\n/g, replacement: "\n" }, // Remove extra blank lines
    ];

    // Apply all patterns
    let formattedCode = codeString;
    for (const { regex, replacement } of patterns) {
        formattedCode = formattedCode.replace(regex, replacement);
    }

    // Fix indentation
    const lines = formattedCode.split("\n");
    let indentationLevel = 0;
    const INDENTATION = "  "; // 2 spaces for indentation

    const formattedLines = lines
        .map((line) => {
            let trimmedLine = line.trim();

            // Adjust indentation level for closing braces
            if (trimmedLine.startsWith("}")) indentationLevel--;

            // Add correct indentation
            const indentedLine =
                indentationLevel >= 0 ? INDENTATION.repeat(indentationLevel) + trimmedLine : trimmedLine;

            // Adjust indentation level for opening braces
            if (trimmedLine.endsWith("{")) indentationLevel++;

            return indentedLine;
        })
        .filter((line) => line.trim().length > 0); // Remove empty lines

    // Join lines back together
    return formattedLines.join("\n");
}