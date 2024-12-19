export class FunctionBuilder<T extends string = never> {

    private readonly _sections: Map<string, string[]> = new Map<string, string[]>();

    append(section: T, body: string) {

        if (this._sections.has(section) === false) {
            this._sections.set(section, []);
        }

        const found = this._sections.get(section)!;

        found.push(body);
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
        return this as FunctionBuilder<T | S>;
    }
}

