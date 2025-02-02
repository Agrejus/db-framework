type Line = string | Block;

abstract class Block {
    protected _lines: Line[] = []; // Allow for injection of blocks in the lines
}

abstract class ContainerBlock extends Block {

    if(condition: string): IfBuilder {
        const builder = new IfBuilder(condition);
        this._lines.push(builder);
        return builder;
    }

    function(name?: string): FunctionBuilder {
        const builder = new FunctionBuilder(name);
        this._lines.push(builder);
        return builder;
    }

    variable(declaration: string): VariableBuilder {
        const builder = new VariableBuilder(declaration);
        this._lines.push(builder);
        return builder;
    }
}

class VariableBuilder extends ContainerBlock {
    private _declaration: string;
    private _value?: string;

    constructor(declaration: string) {
        super();
        this._declaration = declaration;
    }

    value(value: string): this {
        this._value = value;
        return this;
    }
}

class FunctionBuilder extends ContainerBlock {

    private _functionName?: string;
    private _params: string[] = [];

    constructor(name?: string) {
        super();
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
}

class IfBuilder extends ContainerBlock {
    private _condition: string;

    constructor(condition: string) {
        super();
        this._condition = condition;
    }

    appendBody(line: string): this {
        this._lines.push(line);
        return this;
    }
}

class BlockContainer extends ContainerBlock {
    private readonly _blocks: Block[] = [];
}


const root = new BlockContainer();

root.function().parameters('woot').appendBody("return -1");
root.function("test").parameters('woot').appendBody("return -1");
