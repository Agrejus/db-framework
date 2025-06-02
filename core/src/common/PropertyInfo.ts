import { SchemaTypes } from '..';
import { PropertyDeserializer, PropertySerializer, SchemaArray } from '../schema';
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
    readonly isDistinct: boolean;
    readonly indexes: string[];

    readonly injected: any | null = null;
    readonly defaultValue: DefaultValue<any> | null = null;
    readonly valueSerializer: PropertySerializer<T> | null = null;
    readonly valueDeserializer: PropertyDeserializer<T> | null = null;
    readonly functionBody: FunctionBody<any, T> | null;
    readonly children: PropertyInfo<T>[] = [];
    readonly schema: SchemaBase<T, any>;
    readonly innerSchema?: SchemaBase<unknown, any>;
    readonly literals: T[];

    readonly parent?: PropertyInfo<T>;

    constructor(schema: SchemaBase<T, any>, name: string, parent?: PropertyInfo<T> | null) {
        this.schema = schema;
        this.name = name;
        this.type = schema.type;
        this.literals = schema.literals;

        if (schema instanceof SchemaArray) {
            this.innerSchema = schema.innerSchema;
        }

        this.isNullable = schema.isNullable;
        this.isOptional = schema.isOptional;
        this.isKey = schema.isKey;
        this.isIdentity = schema.isIdentity;
        this.isReadonly = schema.isReadonly;
        this.isUnmapped = schema.isUnmapped;
        this.injected = schema.injected;
        this.isDistinct = schema.isDistict;
        this.indexes = schema.indexes;

        this.defaultValue = schema.defaultValue;
        this.valueSerializer = schema.valueSerializer;
        this.valueDeserializer = schema.valueDeserializer;
        this.functionBody = schema.functionBody;

        this.parent = parent;
    }

    get level() {
        let level = 0;
        let current: PropertyInfo<T> | undefined = this;

        while (current) {

            if (current.parent == null) {
                return level;
            }

            current = current.parent;
            level++;
        }

        return level;
    }

    private _getPropertyChain(): PropertyInfo<T>[] {
        const chain: PropertyInfo<T>[] = [];
        let current: PropertyInfo<T> | undefined = this;

        while (current) {
            chain.unshift(current);
            current = current.parent;
        }

        return chain;
    }

    private _needsOptionalChaining(prop: PropertyInfo<T>, assignmentType?: AssignmentType): boolean {
        if (assignmentType === "ASSIGNMENT") {
            return false;
        }

        return assignmentType === "FORCE_NULLABLE_OR_OPTIONAL" || prop.isNullable || prop.isOptional;
    }

    private _resolvePathArray(options?: {
        root?: string,
        assignmentType?: AssignmentType
    }) {
        const path: string[] = options?.root ? [options.root] : [];
        const propertyChain = this._getPropertyChain();

        // Process each property in the chain
        for (const prop of propertyChain) {
            const accessor = this._needsOptionalChaining(prop, options?.assignmentType) ? '?.' : '.';
            path.push(accessor, prop.name);
        }

        return path;
    }

    getPathArray() {
        const path: string[] = [];
        const propertyChain = this._getPropertyChain();

        // Process each property in the chain
        for (const prop of propertyChain) {
            path.push(prop.name);
        }

        return path;
    }

    getParentPathArray() {
        const path: string[] = [];
        const propertyChain = this._getPropertyChain();

        for (let i = 0; i < propertyChain.length - 1; i++) {
            const prop = propertyChain[i];
            path.push(prop.name);
        }

        return path;
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

    getValue(instance: unknown) {
        if (instance == null) {
            return null;
        }

        const pathArray = this.getPathArray();
        let current: any = instance;

        for (const prop of pathArray) {
            if (current == null) {
                return null;
            }
            current = current[prop];
        }

        return current;
    }

    setValue(instance: unknown, value: unknown) {
        if (instance == null) {
            throw new Error('Cannot set value on null or undefined instance');
        }

        const pathArray = this.getPathArray();
        const length = pathArray.length;

        // Fast path for single level properties
        if (length === 1) {
            (instance as any)[pathArray[0]] = value;
            return;
        }

        let current: any = instance;
        let i = 0;

        // Navigate to the parent of the target property
        while (i < length - 1) {
            const prop = pathArray[i];
            const next = current[prop];

            // Only create new object if next level doesn't exist
            if (next == null) {
                current[prop] = {};
            }
            current = current[prop];
            i++;
        }

        // Set the value on the final property
        current[pathArray[length - 1]] = value;
    }

    getSelectrorPath(options: { parent: string, assignmentType?: AssignmentType }) {

        const parts = this._resolvePathArray({
            root: options.parent,
            assignmentType: options.assignmentType
        });

        return parts.join("");
    }

    getAssignmentPath(options?: { parent?: string }) {
        const parts = this._resolvePathArray({
            root: options?.parent,
            assignmentType: "ASSIGNMENT"
        });

        // if there is no parent the first item in the parts list is a .
        if (options?.parent == null) {
            parts.shift();

            return parts.join("");
        }

        return parts.join("");
    }
}

type AssignmentType = "FORCE_NULLABLE_OR_OPTIONAL" | "ASSIGNMENT";