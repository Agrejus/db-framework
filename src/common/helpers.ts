import hash from 'object-hash';

export const chunkArray = <T extends any>(inputArray: T[], size: number): T[][] => {
    return inputArray.reduce((resultArray, item, index) => {
        const chunkIndex = Math.floor(index / size)

        if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = []
        }

        resultArray[chunkIndex].push(item)

        return resultArray
    }, [[]] as T[][]);
}

export const compareObjects = (one: any, two: any) => {
    return hash(one) === hash(two);
}

export const optimizeAsync = <TResult extends any, TArgs extends any>(context: any, callback: (...args: TArgs[]) => Promise<TResult>) => {
    const bound = callback.bind(context) as (...args: TArgs[]) => Promise<TResult>;
    return (...args: TArgs[]) => {
        return new Promise<TResult>((resolve, reject) => {
            setTimeout(async () => {
                try {
                    const response = await bound(...args);
                    resolve(response)
                } catch (e: any) {
                    reject(e);
                }
            }, 0);
        })
    };
}

export const optimizeSync = <TResult extends any, TArgs extends any>(context: any, callback: (...args: TArgs[]) => TResult) => {
    const bound = callback.bind(context) as (...args: TArgs[]) => TResult;
    return (...args: TArgs[]) => {
        return new Promise<TResult>((resolve, reject) => {
            setTimeout(async () => {
                try {
                    const response = bound(...args);
                    resolve(response)
                } catch (e: any) {
                    reject(e);
                }
            }, 0);
        })
    };
}

export const generateRandomId = () => {
    const length = 10;
    const result = Math.random().toString(36).substring(2, length + 2);

    if (!result) {
        return new Date().getTime().toString();
    }

    return result;
}