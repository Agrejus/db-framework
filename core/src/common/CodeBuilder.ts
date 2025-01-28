class CodeBuilder {
    private sections: Map<string, string[]> = new Map();
    private indentLevel = 0;
    private injectedValues: Map<string, any> = new Map();
    
    constructor(private readonly _indent = '    ') {}

    addCode(section: string, code: string) {
        if (!this.sections.has(section)) {
            this.sections.set(section, []);
        }
        this.sections.get(section)!.push(
            this._indent.repeat(this.indentLevel) + code
        );
        return this;
    }

    injectValue(value: any, name = `injected${this.injectedValues.size}`) {
        this.injectedValues.set(name, value);
        return name;
    }

    indent() {
        this.indentLevel++;
        return this;
    }

    outdent() {
        this.indentLevel--;
        return this;
    }

    build() {
        return Array.from(this.sections.values())
            .flat()
            .join('\n');
    }

    compile() {
        const args = [...this.injectedValues.keys()];
        const values = [...this.injectedValues.values()];
        return new Function(...args, this.build())(...values);
    }
}
