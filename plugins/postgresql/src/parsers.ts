export const booleanParser = (value: string) => {
    if (value == null) {
        return null;
    }

    if (value == '1') {
        return true;
    }

    return false;
}

export const integerParser = (value: string) => {
    if (value == null) {
        return null;
    }

    return parseInt(value);
}

export const floatParser = (value: string) => {
    if (value == null) {
        return null;
    }

    return parseFloat(value);
}