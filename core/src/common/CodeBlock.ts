type Line = string | Block;

export abstract class Block {
    protected _lines: Line[] = [];
    protected _indent: string = "";
    protected _parent?: Block;

    constructor(parentIndent: string = "", parent?: Block) {
        this._indent = parentIndent;
        this._parent = parent;
    }

    protected indent(text: string): string {
        return this._indent + text;
    }

    abstract toString(): string;
}

export abstract class ContainerBlock extends Block {
    if<T extends string>(condition: string): IfBuilder<T> {
        const builder = new IfBuilder(condition, { "default": 1 }, this._indent + "  ", this);
        this._lines.push(builder);
        return builder;
    }

    raw(raw: string): RawBuilder {
        const builder = new RawBuilder(raw, this._indent + "  ", this);
        this._lines.push(builder);
        return builder;
    }

    function(name?: string): FunctionBuilder {
        const builder = new FunctionBuilder(name, this._indent + "  ", this);
        this._lines.push(builder);
        return builder;
    }

    variable(declaration: string): VariableBuilder {
        const builder = new VariableBuilder(declaration, this._indent + "  ", this);
        this._lines.push(builder);
        return builder;
    }

    object(): ObjectBuilder {
        const builder = new ObjectBuilder(this._indent + "  ", this);
        this._lines.push(builder);
        return builder;
    }
}

export class VariableBuilder extends ContainerBlock {
    private _declaration: string;
    private _value?: string | Block;

    constructor(declaration: string, parentIndent: string = "", parent?: Block) {
        super(parentIndent, parent);
        this._declaration = declaration;
    }

    value(value: string): this {
        this._value = value;
        return this;
    }

    object(): ObjectBuilder {
        const objectBuilder = new ObjectBuilder(this._indent, this);

        this._value = objectBuilder;

        return objectBuilder;
    }

    toString(): string {

        if (this._value == null) {
            throw new Error("Value cannot be null for Variable Builder")
        }

        return this.indent(`const ${this._declaration} = ${this._value.toString()};`);
    }
}

export class RawBuilder extends ContainerBlock {
    private _raw: string;

    constructor(raw: string, parentIndent: string = "", parent?: Block) {
        super(parentIndent, parent);
        this._raw = raw;
    }

    toString(): string {
        return `${this._raw}\n`;
    }
}

export class ObjectBuilder extends Block {

    property(line: string) {
        // Add comma to previous line if it exists and isn't a brace
        if (this._lines.length > 0) {
            const lastLine = this._lines[this._lines.length - 1];
            if (typeof lastLine === 'string' && !lastLine.endsWith("{")) {
                this._lines[this._lines.length - 1] = lastLine + ",";
            }
        }
        this._lines.push(line);
        return this;
    }

    nested(propertyName: string) {
        const builder = new ObjectBuilder(this._indent + "  ", this);
        // Add comma to previous line if it exists and isn't a brace
        if (this._lines.length > 0) {
            const lastLine = this._lines[this._lines.length - 1];
            if (typeof lastLine === 'string' && !lastLine.endsWith("{")) {
                this._lines[this._lines.length - 1] = lastLine + ",";
            }
        }
        // Add the property name and opening brace
        this._lines.push(`${propertyName}: {`);
        // Add the nested builder
        this._lines.push(builder);
        // Add the closing brace
        this._lines.push("}");
        return builder;
    }

    toString(): string {
        // Check if this is a nested object's content
        const isNestedContent = this._parent instanceof ObjectBuilder;

        if (isNestedContent) {
            // For nested object contents, just return the lines
            return this._lines.map(line =>
                typeof line === 'string'
                    ? this.indent("  " + line)
                    : line.toString()
            ).join('\n');
        }

        // For root objects, include the braces
        const lines = [
            "{",
            ...this._lines.map(line =>
                typeof line === 'string'
                    ? this.indent("  " + line)
                    : line.toString()
            ),
            this.indent("}")
        ];

        return lines.join('\n');
    }
}


export class FunctionBuilder extends ContainerBlock {
    private _functionName?: string;
    private _params: string[] = [];

    constructor(name?: string, parentIndent: string = "", parent?: Block) {
        super(parentIndent, parent);
        this._functionName = name;
    }

    parameters(...params: string[]): this {
        this._params.push(...params);
        return this;
    }

    appendBody(line: string): this {
        this._lines.push(line);
        return this;
    }

    toString(): string {
        const signature = this._functionName
            ? `function ${this._functionName}(${this._params.join(", ")})`
            : `function(${this._params.join(", ")})`;

        const lines = [
            this.indent(signature + " {"),
            ...this._lines.map(line =>
                typeof line === 'string'
                    ? this.indent("  " + line)
                    : line.toString()
            ),
            this.indent("}")
        ];

        return lines.join('\n');
    }
}

abstract class SectionContainerBlock<T extends string> extends Block {

    protected sections: Map<string, Line[]> = new Map<string, Line[]>();
    protected readonly order: { [key in T]: number };

    constructor(order: { [key in T]: number }, parentIndent: string = "", parent?: Block) {
        super(parentIndent, parent);
        this.order = order;
    }

    getOrCreateBlock(key: T) {
        if (this.sections.has(key)) {
            return this.sections.get(key);
        }

        const block = [new CodeBlock()];

        this.sections.set(key, block);

        return block;
    }
}

export class IfBuilder<T extends string> extends SectionContainerBlock<T> {
    private _condition: string;

    constructor(condition: string, order: { [key in T]: number }, parentIndent: string = "", parent?: Block) {
        super(order, parentIndent, parent);
        this._condition = condition;
    }

    appendBody(line: string, section: string = "default"): this {

        const s = this.getOrCreateBlock(section as any) 

        s.push(line);

        return this;
    }

    toString(): string {
        const lines = [];

        const keys = [...this.sections.keys()] as T[];
        keys.sort((a, b) => this.order[a] - this.order[b]); // ascending

        for (const key of keys) {
            const section = this.sections.get(key);
            lines.push([
                this.indent(`if (${this._condition}) {`),
                ...section.map(line =>
                    typeof line === 'string'
                        ? this.indent("  " + line)
                        : line.toString()
                ),
                this.indent("}")
            ]);
        }

        return lines.join("\n\n");
    }
}

export class CodeBlock extends ContainerBlock {

    toString(): string {
        return this._lines.map(line =>
            typeof line === 'string'
                ? this.indent(line)
                : line.toString()
        ).join('\n\n');
    }
}

// this is close, we need to be able to add sections to any block
// that way we can define the order
// can we set an order for each line when added?
// it's hard to have just numbers, we need some
// maybe have generics for each section and in the ctor define the order?
// NOW EACH TIME WE ADD CODE WE NEED A SECTION OR PROVIDE A DEFAULT
export class Code<T extends string> {

    private _sections: Map<string, CodeBlock> = new Map<string, CodeBlock>();
    private readonly _order: { [key in T]: number };

    constructor(order: { [key in T]: number }) {
        this._order = order;
    }

    getOrCreateBlock(key: T) {
        if (this._sections.has(key)) {
            return this._sections.get(key);
        }

        const block = new CodeBlock();

        this._sections.set(key, block);

        return block;
    }

    toString() {
        const lines = [];

        const keys = [...this._sections.keys()] as T[];
        keys.sort((a, b) => this._order[a] - this._order[b]); // ascending

        for (const key of keys) {
            const section = this._sections.get(key);
            lines.push(section.toString());
        }

        return lines.join("\n\n");
    }
}   