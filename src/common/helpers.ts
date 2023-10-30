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