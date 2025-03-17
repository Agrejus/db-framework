import { CompiledSchema, IDbPlugin } from "@agrejus/db-framework-core";
import { DbSet } from "../db-sets/DbSet";
import { DbSetOptions } from "../types";
import { IChangeTracker } from "../change-tracking/types";
import { IDataAccessManager } from "../data-access/types";

export type DbSetInstanceCreator<TEntity extends {}, TEnhancedPropertyNames extends string, TComputedPropertyNames extends string, TDbSet extends DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>> = new (dbPlugin: IDbPlugin, schema: CompiledSchema<TEntity>, options: DbSetOptions) => TDbSet;
export type DataAccessInstanceCreator<TEntity extends {}> = new (schema: CompiledSchema<TEntity>, dbPlugin: IDbPlugin, changeTracker: IChangeTracker<TEntity>) => IDataAccessManager<TEntity>;