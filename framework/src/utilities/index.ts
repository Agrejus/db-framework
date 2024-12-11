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