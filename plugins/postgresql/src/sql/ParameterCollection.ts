export type ParameterGroup = {
    group: string;
    parameters: {
        variableName: string;
        value: any;
        propertyName: string;
        group: string;
    }[];
}

export class ParameterCollection {

    private _parameters: { variableName: string, value: any, propertyName: string, group: string }[] = [];

    get length() {
        return this._parameters.length;
    }

    getVariableNames(group?: string) {

        if (group != null) {
            return this._parameters.filter(w => w.group === group).map(w => w.variableName);
        }

        return this._parameters.map(w => w.variableName);
    }

    getPropertyNames(group?: string) {

        if (group != null) {
            return this._parameters.filter(w => w.group === group).map(w => w.propertyName);
        }

        return this._parameters.map(w => w.propertyName);
    }

    getValues(group?: string) {

        if (group != null) {
            return this._parameters.filter(w => w.group === group).map(w => w.value);
        }

        return this._parameters.map(w => w.value);
    }

    getAssignments(group?: string) {

        if (group != null) {
            return this._parameters.filter(w => w.group === group).map(w => `${w.propertyName} = ${w.variableName}`);
        }

        return this._parameters.map(w => `${w.propertyName} = ${w.variableName}`);
    }

    getGroups() {

        const groups = this._parameters.reduce((a, v) => {
            if (a[v.propertyName] == null) {
                a[v.propertyName] = [];
            }

            a[v.group].push(v)
            return a;
        }, {} as { [key: string]: { variableName: string; value: any; propertyName: string; group: string; }[] })


        return Object.keys(groups).map(w => ({ group: w, parameters: groups[w] })) as ParameterGroup[];
    }

    add(propertyName: string, value: any, group: string) {
        const key = `$${this._parameters.length + 1}`;
        this._parameters.push({ variableName: key, value, propertyName, group });
        return key;
    }
}