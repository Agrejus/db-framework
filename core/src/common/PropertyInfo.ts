import { SchemaTypes } from '..';
import { PropertyDeserializer, PropertySerializer } from '../schema';
import { SchemaBase } from '../schema/property/base/Base';
import { DefaultValue, FunctionBody } from '../types';

export class PropertyInfo<T extends {}> {

    readonly name: string;
    readonly type: SchemaTypes;

    readonly isNullable: boolean;
    readonly isOptional: boolean;
    readonly isKey: boolean;
    readonly isIdentity: boolean;
    readonly isReadonly: boolean;
    readonly isUnmapped: boolean;

    readonly injected: any | null = null;
    readonly defaultValue: DefaultValue<any> | null = null;
    readonly valueSerializer: PropertySerializer<T> | null = null;
    readonly valueDeserializer: PropertyDeserializer<T> | null = null;
    readonly functionBody: FunctionBody<any, T> | null;
    readonly children: PropertyInfo<T>[] = [];
    readonly schema: SchemaBase<T, any>;

    readonly parent?: PropertyInfo<T>;

    private _pathParts: string[] = [];
    private _joinParts: string[] = [];

    constructor(schema: SchemaBase<T, any>, name: string, parent?: PropertyInfo<T> | null) {
        this.schema = schema;
        this.name = name;
        this.type = schema.type;

        this.isNullable = schema.isNullable;
        this.isOptional = schema.isOptional;
        this.isKey = schema.isKey;
        this.isIdentity = schema.isIdentity;
        this.isReadonly = schema.isReadonly;
        this.isUnmapped = schema.isUnmapped;
        this.injected = schema.injected;

        this.defaultValue = schema.defaultValue;
        this.valueSerializer = schema.valueSerializer;
        this.valueDeserializer = schema.valueDeserializer;
        this.functionBody = schema.functionBody;

        this.parent = parent;
    }

    private _resolvePathArray(forceNullableOrOptional: boolean = false) {

        if (this._pathParts.length > 0) {
            return {
                parts: this._pathParts,
                join: forceNullableOrOptional === true ? ["?."] : ["."]
            }
        }

        const parentsList: PropertyInfo<T>[] = [];
        this._pathParts.push(this.name);

        let parent = this.parent;

        while (parent != null) {
            parentsList.unshift(parent);
            this._pathParts.unshift(parent.name);
            parent = parent.parent;
        }

        let areAnyNullableOrOptional: boolean = false
        for (let i = 0; i < parentsList.length; i++) {

            const item = parentsList[i];
            if (areAnyNullableOrOptional === false && (item.isNullable === true || item.isOptional === true)) {
                areAnyNullableOrOptional = true;
            }

            if (areAnyNullableOrOptional === true || forceNullableOrOptional === true) {
                this._joinParts.push("?.")
                continue;
            }

            this._joinParts.push(".");
        }

        return {
            parts: this._pathParts,
            join: this._joinParts
        };
    }

    get hasNullableParents() {

        let parent = this.parent;

        while (parent != null) {

            if (parent.isNullable || parent.isOptional) {
                return true;
            }

            parent = parent.parent;
        }

        return false;
    }

    get hasIdentityChildren() {
        const children = [...this.children];

        for (let i = 0; i < children.length; i++) {
            const child = children[i];

            if (child.isIdentity === true) {
                return true;
            }

            if (child.children.length > 0) {
                children.push(...child.children)
            }
        }

        return false;
    }

    getSelectrorPath(parent: string, options?: { forceNullableOrOptional?: boolean }) {

        const resolved = this._resolvePathArray(options?.forceNullableOrOptional);
        const parts: string[] = [];
        const pathArray = [parent, ...resolved.parts];
        let join = resolved.join;

        if (options?.forceNullableOrOptional === true) {
            join = new Array(join.length).fill("?.");
        }

        for (let i = 0; i < pathArray.length; i++) {

            parts.push(pathArray[i]);

            if (i > join.length - 1) {
                continue;
            }

            parts.push(join[i]);
        }

        return parts.join("");
    }

    getAssignmentPath(parent?: string) {
        const resolved = this._resolvePathArray();
        const pathArray = !!parent ? [parent, ...resolved.parts] : resolved.parts;
        return pathArray.join(".");
    }
}