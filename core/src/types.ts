export type IdType = string | number;
export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export type DefaultValue<T, I = never> = T | ((injected: I) => T);
export type FunctionBody<TEntity, TResult> = (entity: TEntity, tableName: string) => TResult;