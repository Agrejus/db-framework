export const setPropertyValue = (instance: any, path: string, value: any) => {

    const split = path.split('.');

    let deepInstance = instance;

    for (let i = 0; i < split.length; i++) {
        const key = split[i];
        if (i == split.length - 1) {
            deepInstance[key] = value;
            break;
        }

        deepInstance = instance[key];
    }
}

export const forEach = <T>(data: T[], callback: (item: T, next: () => void) => void, done: () => void) => {

    if (data.length === 0) {
        done();
        return;
    }
    let index = 0;
    const next = () => {
        index++;

        if (index >= data.length) {
            done();
            return;
        }

        callback(data[index], next);
    }

    callback(data[index], next);

}