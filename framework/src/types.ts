import { CompiledSchema, EntityChanges, EntityModificationResult, GenericFunction, IdType, InferCreateType, InferType, TrampolinePipeline } from "@agrejus/db-framework-core";

export type QueryResult<T> = (value: T, error?: any) => void;
export type EntityMap<T extends {}, R> = GenericFunction<T, R>;
export type EntitySelector<T extends {}> = GenericFunction<InferType<T>, boolean>;
export type EntityParamsSelector<T extends {}, P> = (payload: [InferType<T>, P]) => boolean;

export type EntityCallbackMany<T extends {}> = (entities: InferType<T>[], error?: any) => void;
export type ChangeTrackedEntity<T extends {}> = T & {
    __tracking__?: {
        isDirty: boolean;
        changes: { [K in keyof T]: T[K] },
        original: { [K in keyof T]: T[K] },
        isPaused: boolean
    },
    __isProxy__: true
}

export type Enricher<T extends {}> = GenericFunction<T, void>;
export type IdGetter<T extends {}> = GenericFunction<T, IdType>;
export type DeepKeyOf<T> = T extends object ? {
    [Key in keyof T & (string | number)]: T[Key] extends object
    ? `${Key & string}` | `${Key & string}.${DeepKeyOf<T[Key]>}`
    : `${Key & string}`
}[keyof T & (string | number)] : never;

export type DeepValueType<T, P extends string> =
    P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
    ? DeepValueType<T[K], Rest>
    : never
    : P extends keyof T
    ? T[P]
    : never;

export type NonOverlappingKeys<T, U> = Exclude<keyof T, keyof U>;

export type DeepNonOverlappingKeys<
    T,
    U,
    Path extends string = ""
> = {
    [K in keyof T]: K extends string | number | bigint | boolean // Restrict K to valid key types
    ? K extends keyof U
    ? T[K] extends Array<infer TItem> // Check if T[K] is an array
    ? U[K] extends Array<infer UItem> // Check if U[K] is also an array
    ? [TItem] extends [UItem] // Compare array item types
    ? [UItem] extends [TItem]
    ? never // Exclude if array item types match
    : `${Path}${K}`
    : `${Path}${K}`
    : `${Path}${K}` // Include if U[K] is not an array
    : T[K] extends Record<string, any> // If T[K] is an object
    ? U[K] extends Record<string, any> // If U[K] is also an object
    ? DeepNonOverlappingKeys<T[K], U[K], `${Path}${K}.`> extends never
    ? never // If no unique nested keys, exclude this key
    : `${Path}${K}` // Include this key if nested keys are unique
    : `${Path}${K}` // Include if U[K] is not an object
    : never // Exclude if T[K] exists in U and is not an object
    : `${Path}${K}` // Include full path if key does not exist in U
    : never; // Exclude invalid keys
}[keyof T];

export type DeepOptional<T> = {
    [K in keyof T]?: T[K] extends Record<string, any>
    ? T[K] extends Array<infer U> // Check if T[K] is an array
    ? Array<DeepOptional<U>> // Recursively make array elements optional
    : DeepOptional<T[K]> // Recursively make object properties optional
    : T[K]; // Keep non-object types as they are
};

export type DbSetOptions = {
    stateful: boolean;
    signal: AbortSignal
}

export type StatefulDbSetOptions = DbSetOptions & {
    optimistic: boolean
}

export type SaveChangesContextStepOne = {
    count: number;
}

export type SaveChangesContextStepTwo = SaveChangesContextStepOne & {
    hasChanges: boolean;
}

export type SaveChangesContextStepThree<T> = SaveChangesContextStepTwo & {
    adds: EntityChanges<T>["adds"];
    find: (entity: InferType<T>) => InferCreateType<T> | undefined;
}

export type SaveChangesContextStepFour<T> = SaveChangesContextStepThree<T> & {
    removes: EntityChanges<T>["removes"];
}

export type SaveChangesContextStepFive<T> = SaveChangesContextStepFour<T> & {
    updates: EntityChanges<T>["updates"];
}

export type SaveChangesContextStepSix<T> = SaveChangesContextStepFive<T> & {
    result: EntityModificationResult<T> | null;
}

export type DbSetPipelines = {
    save: TrampolinePipeline<SaveChangesContextStepOne>;
    hasChanges: TrampolinePipeline<{ hasChanges: boolean }>
}