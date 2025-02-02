abstract class Block {
    protected _level: number = 0;
    protected _blocks: Block[] = [];
    protected _lines: string[] = [];
    
    constructor(
      protected readonly key: string,
      protected readonly parent?: Block
    ) {
      if (parent) {
        this._level = parent.getLevel() + 1;
      }
    }
  
    getLevel(): number {
      return this._level;
    }
  
    blockExists(key: string): boolean {
      return this._blocks.some(b => b.key === key);
    }
  
    protected indent(text: string): string {
      return "  ".repeat(this._level) + text;
    }
  
    toString(): string {
      const lines = [
        ...this._lines.map(line => this.indent(line)),
        ...this._blocks.map(block => block.toString())
      ];
      return lines.join("\n");
    }
  }
  
  interface BlockContainer {
    if(key: string): IfBuilder;
    function(key: string): FunctionBuilder;
    variable(key: string): VariableBuilder;
    createBlock(key: string): ContainerBlock; // Changed return type here
  }
  
  abstract class ContainerBlock extends Block implements BlockContainer {
    if(key: string): IfBuilder {
      const builder = new IfBuilder(key, this);
      this._blocks.push(builder);
      return builder;
    }
  
    function(key: string): FunctionBuilder {
      const builder = new FunctionBuilder(key, this);
      this._blocks.push(builder);
      return builder;
    }
  
    variable(key: string): VariableBuilder {
      const builder = new VariableBuilder(key, this);
      this._blocks.push(builder);
      return builder;
    }
  
    createBlock(key: string): ContainerBlock { // Changed return type and implementation
      const block = new BlockContainer(key, this); // Added new concrete class
      this._blocks.push(block);
      return block;
    }
  }
  
  // Added concrete BlockContainer class
  class BlockContainer extends ContainerBlock {} // Simple concrete implementation
  
  export class Body extends ContainerBlock {}
  
  export class FunctionBuilder extends ContainerBlock {
    private _functionName?: string;
    private _params: string[] = [];
  
    name(value: string): this {
      this._functionName = value;
      return this;
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
        debugger;
      const lines = [
        this.indent(signature + " {"),
        ...this._lines.map(line => this.indent("  " + line)),
        ...this._blocks.map(block => block.toString()),
        this.indent("}")
      ];
      return lines.join("\n");
    }
  }
  
  class IfBuilder extends ContainerBlock {
    private _condition?: string;
  
    statement(condition: string): this {
      this._condition = condition;
      return this;
    }
  
    appendBody(line: string): this {
      this._lines.push(line);
      return this;
    }
  
    toString(): string {
      const lines = [
        this.indent(`if (${this._condition}) {`),
        ...this._lines.map(line => this.indent("  " + line)),
        ...this._blocks.map(block => block.toString()),
        this.indent("}")
      ];
      return lines.join("\n");
    }
  }
  
  class VariableBuilder extends Block {
    private _variableName?: string;
    private _value?: string;
  
    name(value: string): this {
      this._variableName = value;
      return this;
    }
  
    value(value: string): this {
      this._value = value;
      return this;
    }
  
    toString(): string {
      return this.indent(`const ${this._variableName} = ${this._value};`);
    }
  }