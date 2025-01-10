import { CompiledSchema, IDbPlugin } from "@agrejus/db-framework-core";
import { DbSet } from "../DbSet";
import { DbSetOptions } from "../types";
import { IChangeTracker } from "../change-tracking/types";
import { IDataAccessManager } from "../data-access/types";

export type DbSetInstanceCreator<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> = new (dbPlugin: IDbPlugin, schema: CompiledSchema<TEntity>, options: DbSetOptions) => DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>;
export type DataAccessInstanceCreator<TEntity extends {}> = new (schema: CompiledSchema<TEntity>, dbPlugin: IDbPlugin, changeTracker: IChangeTracker<TEntity>) => IDataAccessManager<TEntity>;