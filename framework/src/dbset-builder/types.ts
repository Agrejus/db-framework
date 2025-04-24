import { CompiledSchema, IDbPlugin } from "@agrejus/db-framework-core";
import { DbSet } from "../db-sets/DbSet";
import { DbSetOptions, DbSetPipelines } from "../types";

export type DbSetInstanceCreator<TEntity extends {}, TDbSet extends DbSet<TEntity>> = new (dbPlugin: IDbPlugin, schema: CompiledSchema<TEntity>, options: DbSetOptions, pipelines: DbSetPipelines) => TDbSet;