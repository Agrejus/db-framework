export class FunctionBuilderV2<T extends string = never> {

    private readonly _sections: Map<string, string[]> = new Map<string, string[]>();
    private readonly _injections: Map<string, any> = new Map<string, any>();

    append(section: T, body: string) {

        if (this._sections.has(section) === false) {
            this._sections.set(section, []);
        }

        const found = this._sections.get(section)!;

        found.push(body);
    }

    inject(value: any, name?: string) {
        const key = name ?? `injection${this._injections.size}`;
        this._injections.set(key, value);
        return key;
    }

    hasInjections() {
        return this._injections.size > 0;
    }

    getInjectionsValues() {
        return [...this._injections.values()];
    }

    getInjectionsKeys() {
        return [...this._injections.keys()];
    }

    unshift(section: T, body: string) {

        if (this._sections.has(section) === false) {
            this._sections.set(section, []);
        }

        const found = this._sections.get(section)!;

        found.unshift(body);
    }

    get(section: T) {
        return this._sections.get(section) ?? [];
    }

    join(section: T, separator: string) {
        return this.get(section).join(separator);
    }

    use<S extends string>(section: S) {
        return this as FunctionBuilderV2<T | S>;
    }
}

