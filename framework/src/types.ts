import { IdType, NonNullEntity } from "@agrejus/db-framework-core";

export type EntitySelector<T extends {}> = (entity:  NonNullEntity<T>, index?: number, array?:  NonNullEntity<T>[]) => boolean;
export type EntityParamsSelector<T extends {}, P> = (payload: [NonNullEntity<T>, P], index?: number, array?:  NonNullEntity<T>[]) => boolean;
export type EntityCallbackOne<T extends {}> = (entity: NonNullEntity<T> | null, error?: any) => void;
export type EntityCallbackMany<T extends {}> = (entities: NonNullEntity<T>[], error?: any) => void;
export type ChangeTrackedEntity<T extends {}> = T & {
    __tracking__?: {
        isDirty: boolean;
        changes: { [K in keyof T]: T[K] },
        original: { [K in keyof T]: T[K] },
        isPaused: boolean
    },
    __isProxy__: true
}

export type Enricher<T extends {}> = (instance: T) => void;
export type IdGetter<T extends {}> = (instance: T) => IdType;
export type DeepKeyOf<T> = {
    [Key in keyof T & (string | number)]: T[Key] extends object ? `${Key}` | `${Key}.${DeepKeyOf<T[Key]>}` : `${Key}`
}[keyof T & (string | number)];
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