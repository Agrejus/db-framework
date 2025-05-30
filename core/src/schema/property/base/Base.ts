import { PropertyDeserializer, PropertySerializer, SchemaModifiers, SchemaTypes } from "../..";
import { DefaultValue, FunctionBody } from "../../../types";

export abstract class SchemaBase<T extends any, TModifiers extends SchemaModifiers> {

    abstract instance: T;
    modifiers: TModifiers;

    isNullable: boolean = false;
    isUnmapped: boolean = false;
    isOptional: boolean = false;
    isKey: boolean = false;
    isIdentity: boolean = false;
    isReadonly: boolean = false;
    isDistict: boolean = false;
    indexes: string[] = [];

    injected: any = null;
    defaultValue: DefaultValue<T> | null = null;
    valueSerializer: PropertySerializer<T> | null = null;
    valueDeserializer: PropertyDeserializer<T> | null = null;
    type: SchemaTypes;
    functionBody: FunctionBody<any, T> | null;
    private _schemaBase = true;
    readonly literals: T[] = [];

    constructor(entity?: SchemaBase<T, TModifiers>, literals?: T[]) {

        if (entity != null) {
            this.valueSerializer = entity.valueSerializer;
            this.valueDeserializer = entity.valueDeserializer;
            this.functionBody = entity.functionBody;
            this.isNullable = entity.isNullable;
            this.isOptional = entity.isOptional;
            this.isKey = entity.isKey;
            this.isIdentity = entity.isIdentity;
            this.isReadonly = entity.isReadonly;
            this.defaultValue = entity.defaultValue;
            this.type = entity.type;
            this.injected = entity.injected;
            this.indexes = entity.indexes;
        }

        if (literals) {
            this.literals = literals;
        }
    }
}