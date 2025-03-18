import { DbSet } from "./DbSet";

export class StatefulDbSet<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> extends DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames> {


}