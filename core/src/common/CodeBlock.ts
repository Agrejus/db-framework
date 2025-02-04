export type Line<T extends BlockType> = string | Block<T>;
export type BlockType = string | "default";

export abstract class Block<T extends BlockType> {
    protected sections: Map<string, Line<T>[]> = new Map<string, Line<T>[]>();
    protected readonly order: { [key in T]: number };
    protected _indent: string = "";
    protected _parent?: Block<any>;

    constructor(order: { [key in T]: number }, parentIndent: string = "", parent?: Block<any>) {
        this.order = order;
        this._indent = parentIndent;
        this._parent = parent;
    }

    protected indent(text: string): string {
        return this._indent + text;
    }

    push(key: T, lines: Line<T>[]) {
        const block = this.getOrCreateBlock(key);

        block.
    }

    getOrCreateBlock(key: T) {
        if (this.sections.has(key)) {
            return this.sections.get(key);
        }

        const block = [new CodeBlock()];

        this.sections.set(key, block);

        return block;
    }

    abstract toString(): string;
}

export abstract class ContainerBlock<T extends BlockType> extends Block<T> {
    if(condition: string): IfBuilder<T> {
        const builder = new IfBuilder<BlockType>(condition, { "default": 1 }, this._indent + "  ", this);
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

export class VariableBuilder<T extends BlockType> extends ContainerBlock<T> {
    private _declaration: string;
    private _value?: string | Block<any>;

    constructor(declaration: string, parentIndent: string = "", parent?: Block<any>) {
        super(parentIndent, parent);
        this._declaration = declaration;
    }

    value(value: string): this {
        this._value = value;
        return this;
    }

    object<N extends BlockType>(): ObjectBuilder<N> {
        const objectBuilder = new ObjectBuilder<N>(this._indent, this);

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

export class RawBuilder<T extends BlockType> extends ContainerBlock<T> {
    private _raw: string;

    constructor(raw: string, parentIndent: string = "", parent?: Block<any>) {
        super(parentIndent, parent);
        this._raw = raw;
    }

    toString(): string {
        return `${this._raw}\n`;
    }
}

export class ObjectBuilder<T extends BlockType> extends Block<T> {

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

    nested<N extends BlockType>(propertyName: string) {
        const builder = new ObjectBuilder<N>(this._indent + "  ", this);
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


export class FunctionBuilder<T extends BlockType> extends ContainerBlock<T> {
    private _functionName?: string;
    private _params: string[] = [];

    constructor(order: { [key in T]: number }, name?: string, parentIndent: string = "", parent?: Block<any>) {
        super(order, parentIndent, parent);
        this._functionName = name;
    }

    parameters(...params: string[]): this {
        this._params.push(...params);
        return this;
    }

    appendBody(line: string, section: string = "default"): this {
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

export class IfBuilder<T extends BlockType> extends ContainerBlock<T> {
    private _condition: string;

    constructor(condition: string, order: { [key in T]: number }, parentIndent: string = "", parent?: Block<any>) {
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