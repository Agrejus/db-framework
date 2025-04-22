import { CompiledSchema, EntityModificationResult, NonNullCreateEntity, NonNullEntity } from "@agrejus/db-framework-core";
import { FetchOptions } from "../data-access/types";
import { EntityCallbackMany } from "../types";
import { AdditionsPackage, IChangeTrackerStrategy } from "./types";
import { IdentityKeyChangeTrackingStrategy } from './strategies/IdentityKeyChangeTrackingStrategy';
import { NonIdentityKeyChangeTrackingStrategy } from './strategies/NonIdentityKeyChangeTrackingStrategy';

export class ChangeTracker<T extends {}> {

    private readonly _strategy: IChangeTrackerStrategy<T>;

    constructor(strategy: IChangeTrackerStrategy<T>) {
        this._strategy = strategy;
    }

    add(entities: NonNullCreateEntity<T>[], done: EntityCallbackMany<T>) {
        return this._strategy.add(entities, done);
    }

    remove(entities: NonNullEntity<T>[], done: EntityCallbackMany<T>) {
        return this._strategy.remove(entities, done);
    }

    resolve(entities: NonNullEntity<T>[], options?: FetchOptions) {
        return this._strategy.resolve(entities, options);
    }

    hasChanges(): boolean {
        return this._strategy.hasChanges();
    }

    replace(existingEntity: NonNullEntity<T> | NonNullCreateEntity<T>, newEntity: NonNullEntity<T> | NonNullCreateEntity<T>) {
        return this._strategy.replace(existingEntity, newEntity);
    }

    enrich(entities: NonNullEntity<T>[]): NonNullEntity<T>[] {
        return this._strategy.enrich(entities);
    }

    prepareRemovals() {
        if (this.hasChanges() === false) {
            return [];
        }

        return this._strategy.prepareRemovals();
    }

    prepareAdditions() {
        return this._strategy.prepareAdditions();
    }

    getAttachmentsChanges() {
        return this._strategy.getAttachmentsChanges();
    }

    mergeChanges(changes: EntityModificationResult<T>, addPackge: AdditionsPackage<T>) {
        this._strategy.mergeChanges(changes, addPackge);
    }

    clearAdditions() {
        this._strategy.clearAdditions();
    }

    private static _createStrategy<T extends {}>(schema: CompiledSchema<T>) {
        if (schema.hasIdentityKeys === true) {
            return new IdentityKeyChangeTrackingStrategy(schema)
        }

        return new NonIdentityKeyChangeTrackingStrategy(schema);
    }

    static create<T extends {}>(schema: CompiledSchema<T>) {
        const strategy = ChangeTracker._createStrategy<T>(schema);

        return new ChangeTracker<T>(strategy);
    }
}   