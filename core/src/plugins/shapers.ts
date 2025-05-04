export const count = <T>(data: T[]): number => {
    return data.length;
}

export const max = <T extends number>(data: T[]): null | T => {

    if (data.length === 0) {
        return null;
    }

    data.sort((a, b) => b - a);

    return data[0];
}

export const min = <T extends number>(data: T[]): null | T => {

    if (data.length === 0) {
        return null;
    }

    data.sort((a, b) => a - b);

    return data[0];
}

export const sum = <T extends number>(data: T[]): number => {

    let result = 0;

    for (let i = 0, length = data.length; i < length; i++) {
        result += data[i];
    }

    return result;
}

export const skip = <T>(skip: number, data: T[]): T[] => {

    if (data.length < skip) {
        return []
    }

    return data.slice(skip);
}

export const take = <T>(take: number, data: T[]): T[] => {

    if (data.length === 0) {
        return [];
    }

    return data.slice(0, take);
}

export const distinct = <T>(data: T[]): T[] => {
    return Object.values(data.reduce((a, v) => ({ ...a, [(typeof v === "number" || typeof v === "string" ? v : JSON.stringify(v))]: v }), {} as Record<string, T>))
}