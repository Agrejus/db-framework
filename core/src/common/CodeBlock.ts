import { uuid } from "../utilities/uuid";

type Line = string | Block;

type Param = { name: string, value: any };
type GenericParam = { name: string, callName: string };

export type Insert = { index: number, type: "before" | "after", unshift: boolean };
export type CreateBlockOptions = { name?: string, unshift?: boolean };

export abstract class Block {
    readonly name: string;
    protected _lines: Line[] = [];
    protected _indent: string = "";
    protected _parent?: Block;

    constructor(name?: string, parentIndent: string = "", parent?: Block) {
        this.name = name != null ? name : uuid();
        this._indent = parentIndent;
        this._parent = parent;
    }

    indexOf(name: string) {
        return this._lines.findIndex(w => typeof w !== "string" && w.name === name);
    }

    getOrDefault<T extends Block>(name: string): T | undefined {

        if (name.includes('.') === false) {
            return this._lines.find(w => typeof w !== "string" && w.name === name) as T | undefined;
        }

        const split = name.match(/(\[[^\]]+\]|[^.]+)/g);
        let result: Block = this;

        for (const item of split) {
            const found = result._lines.find(w => typeof w !== "string" && w.name === item) as Block;

            if (found == null) {

                if ("getValue" in result && result.getValue instanceof Block && result.getValue.name === item) {
                    result = result.getValue;
                    continue;
                }

                return undefined;
            }

            result = found;
        }

        return result as T;
    }

    get<T extends Block>(name: string): T {
        const found = this.getOrDefault(name);

        if (found == null) {
            throw new Error(`Error finding code block for given path.  Path: ${name}`)
        }

        return found as T;
    }

    has(name: string) {
        return this._lines.some(w => typeof w !== "string" && w.name === name);
    }

    protected push(line: Line) {
        this._lines.push(line);
    }

    protected unshift(line: Line) {
        this._lines.unshift(line);
    }

    protected indent(text: string): string {
        return this._indent + text;
    }


    abstract toString(): string;
}

export abstract class ContainerBlock extends Block {
    if(condition: string, options?: CreateBlockOptions): IfBuilder {
        const builder = new IfBuilder(condition, options?.name, this._indent + "  ", this);
        if (options?.unshift === true) {
            this.unshift(builder);
        } else {
            this.push(builder);
        }

        return builder;
    }

    raw(raw: string, options?: CreateBlockOptions): RawBuilder {
        const builder = new RawBuilder(raw, options?.name, this._indent + "  ", this);
        this.push(builder);
        return builder;
    }

    function(name?: string, options?: CreateBlockOptions): FunctionBuilder {
        const builder = new FunctionBuilder(name, options?.name, this._indent + "  ", this);
        this.push(builder);
        return builder;
    }

    factory(name?: string, options?: CreateBlockOptions): FunctionFactoryBuilder {
        const builder = new FunctionFactoryBuilder(name, options?.name, this._indent + "  ", this);
        this.push(builder);
        return builder;
    }

    variable(declaration: string, options?: CreateBlockOptions): VariableBuilder {
        const builder = new VariableBuilder(declaration, options?.name, this._indent + "  ", this);
        this.push(builder);
        return builder;
    }

    assign(variableName: string, options?: CreateBlockOptions): AssignmentBuilder {
        const builder = new AssignmentBuilder(variableName, options?.name, this._indent + "  ", this);
        this.push(builder);
        return builder;
    }

    object(options?: CreateBlockOptions): ObjectBuilder {
        const builder = new ObjectBuilder(options?.name, this._indent + "  ", this);
        this.push(builder);
        return builder;
    }

    slot(name: string) {
        const builder = new SlotBlock(name, this._indent + "  ", this);
        this.push(builder);
        return builder;
    }

    array(accessor: string, options?: CreateBlockOptions) {
        const builder = new ArrayBuilder(accessor, options?.name, this._indent + "  ", this);
        this.push(builder);
        return builder;
    }
}

export type StringType = "template" | "default";

export class StringBuilder extends Block {

    private _type: StringType;

    constructor(type: StringType, name?: string, parentIndent: string = "", parent?: Block) {
        super(name, parentIndent, parent);
        this._type = type;
    }

    append(value: string) {
        this._lines.push(value);
        return this;
    }

    toString() {
        if (this._type === "template") {
            return "`" + this._lines.join("") + "`";
        }

        return `"${this._lines.join("")}"`;
    }
}

export class SlotBlock extends ContainerBlock {

    constructor(name: string, parentIndent: string = "", parent?: Block) {
        super(name, parentIndent, parent);
    }

    insert(line: string | Block) {
        this.push(line);
    }

    toString(): string {
        return this._lines.map(line =>
            typeof line === 'string'
                ? this.indent(line)
                : line.toString()
        ).join('\n\n');
    }
}

export class AssignmentBuilder extends ContainerBlock {
    protected _variableName: string;
    protected _value?: string | Block;
    protected _functionName?: string;

    get getValue() {
        return this._value;
    }

    constructor(variableName: string, name?: string, parentIndent: string = "", parent?: Block) {
        super(name, parentIndent, parent);
        this._variableName = variableName;
    }

    value(value: string): this {
        this._value = value;
        return this;
    }

    and(and: string, options?: CreateBlockOptions): this {
        this._value = new AndBuilder(and, options?.name, this._indent, this);
        return this;
    }

    object(options?: CreateBlockOptions): ObjectBuilder {
        const objectBuilder = new ObjectBuilder(options?.name, this._indent, this);

        this._value = objectBuilder;

        return objectBuilder;
    }

    call(functionName: string, options?: CreateBlockOptions): ObjectBuilder {
        this._functionName = functionName;
        const objectBuilder = new ObjectBuilder(options?.name, this._indent, this);

        this._value = objectBuilder;

        return objectBuilder;
    }

    string(type: StringType, options?: CreateBlockOptions) {
        const stringBuilder = new StringBuilder(type, options?.name, this._indent, this);

        this._value = stringBuilder;

        return stringBuilder;
    }

    toString(): string {

        if (this._value == null) {
            throw new Error("Value cannot be null for AssignmentBuilder Builder")
        }

        if (this._functionName != null) {
            return this.indent(`${this._variableName} = ${this._functionName}(${this._value.toString()});`);
        }

        return this.indent(`${this._variableName} = ${this._value.toString()};`);
    }
}

export class AndBuilder extends ContainerBlock {

    constructor(and: string, name?: string, parentIndent: string = "", parent?: Block) {
        super(name, parentIndent, parent);
        this._lines.push(and);
    }

    and(and: string) {
        this._lines.push(and);
    }

    toString() {
        return this._lines.join(" && ")
    }
}

export class VariableBuilder extends Block {
    protected _declaration: string;
    protected _value?: string | Block;

    get getValue() {
        return this._value;
    }

    constructor(declaration: string, name?: string, parentIndent: string = "", parent?: Block) {
        super(name, parentIndent, parent);
        this._declaration = declaration;
    }

    value(value: string): this {
        this._value = value;
        return this;
    }

    object(options?: CreateBlockOptions): ObjectBuilder {
        const objectBuilder = new ObjectBuilder(options?.name, this._indent, this);

        this._value = objectBuilder;

        return objectBuilder;
    }

    array(accessor: string, options?: CreateBlockOptions): ArrayBuilder {
        const arrayBuilder = new ArrayBuilder(accessor, options?.name, this._indent, this);

        this._value = arrayBuilder;

        return arrayBuilder;
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

    constructor(raw: string, name?: string, parentIndent: string = "", parent?: Block) {
        super(name, parentIndent, parent);
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
        this.push(line);
        return this;
    }

    nested(propertyName: string, name?: string) {
        const builder = new ObjectBuilder(name, this._indent + "  ", this);
        // Add comma to previous line if it exists and isn't a brace
        if (this._lines.length > 0) {
            const lastLine = this._lines[this._lines.length - 1];
            if (typeof lastLine === 'string' && !lastLine.endsWith("{")) {
                this._lines[this._lines.length - 1] = lastLine + ",";
            }
        }
        // Add the property name and opening brace
        this.push(`${propertyName}: {`);
        // Add the nested builder
        this.push(builder);
        // Add the closing brace
        this.push("}");
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

export class FunctionFactoryBuilder extends ContainerBlock {
    private _functionName?: string;
    private _params: Param[] = [];
    private _return: boolean = false;

    constructor(functionName?: string, sectionName?: string, parentIndent: string = "", parent?: Block) {
        super(sectionName, parentIndent, parent);
        this._functionName = functionName;
    }

    getParameters() {
        return [...this._params];
    }

    createParameter(value: any): Param {
        const name = `injection${this._params.length}`;
        return {
            name,
            value
        }
    }

    parameters(...params: Param[]): this {
        this._params.push(...params);
        return this;
    }

    return() {
        this._return = true;
        return this;
    }

    appendBody(line: string): this {
        this.push(line);
        return this;
    }

    invoke() {
        const body = this.toString();
        const parameterNames = this._getParameterNames();
        const parameterValues = this._getParameterValues();

        return Function(...parameterNames, body)(...parameterValues)
    }

    private _getParameterNames() {
        return this._params.map(w => w.name).join(", ")
    }

    private _getParameterValues() {
        return this._params.map(w => w.value);
    }

    toString(): string {
        const r = this._return === true ? "return " : "";
        const signature = this._functionName
            ? `${r}function ${this._functionName}(${this._getParameterNames()})`
            : `${r}function(${this._getParameterNames()})`;

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

export class FunctionBuilder extends ContainerBlock {
    private _functionName?: string;
    private _params: (string | GenericParam)[] = [];
    private _return: boolean = false;

    constructor(functionName?: string, sectionName?: string, parentIndent: string = "", parent?: Block) {
        super(sectionName, parentIndent, parent);
        this._functionName = functionName;
    }

    parameters(...params: (string | GenericParam)[]): this {
        this._params.push(...params);
        return this;
    }

    return() {
        this._return = true;
        return this;
    }

    appendBody(line: string): this {
        this.push(line);
        return this;
    }

    private _getParameterKeys() {
        return this._params.map(w => typeof w === "object" ? w.name : w).join(", ")
    }

    toCallable() {
        return `${this._functionName}(${this._params.map(w => typeof w === "object" ? w.callName : w).join(", ")})`
    }

    toString(): string {
        const r = this._return === true ? "return " : "";
        const signature = this._functionName
            ? `${r}function ${this._functionName}(${this._getParameterKeys()})`
            : `${r}function(${this._getParameterKeys()})`;

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

export class ArrayBuilder extends Block {
    constructor(accessor: string, name?: string, parentIndent: string = "", parent?: Block) {
        super(name, parentIndent, parent);
        this._lines.push(accessor);
    }

    append(accessor: string) {
        this._lines.push(accessor);
        return this;
    }

    toString() {
        return `[${this._lines.join(",")}]`
    }
}

export class IfBuilder extends ContainerBlock {
    private _condition: string;

    constructor(condition: string, name?: string, parentIndent: string = "", parent?: Block) {
        super(name, parentIndent, parent);
        this._condition = condition;
    }

    appendBody(line: string): this {
        this.push(line);
        return this;
    }

    unshiftBody(line: string): this {
        this.unshift(line);
        return this;
    }

    private stringifyLine(line: Line) {
        if (typeof line === 'string') {
            return this.indent("  " + line);
        }

        if (Array.isArray(line)) {
            return line.join("\r\n")
        }

        return line.toString();
    }

    toString(): string {
        // need to join with \r\n because we are not an object
        const lines = [
            this.indent(`if (${this._condition}) {`),
            this._lines.map(x => this.stringifyLine(x)).join("\r\n"),
            this.indent("}")
        ]

        return lines.join("\n\n");
    }
}

export class CodeBuilder extends ContainerBlock {

    toString(): string {
        return this._lines.map(line =>
            typeof line === 'string'
                ? this.indent(line)
                : line.toString()
        ).join('\n\n');
    }
}