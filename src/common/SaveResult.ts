import { Changes } from "../types/common-types";
import { IEntityUpdates } from "../types/context-types";
import { IDbRecord, IRemovalRecord } from "../types/entity-types";
import { ReadOnlyList } from "./ReadOnlyList";

export class SaveResult<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> implements Changes<TDocumentType, TEntity> {

    adds: ReadOnlyList<TEntity>;
    removes: ReadOnlyList<IRemovalRecord<TDocumentType, TEntity>>;
    updates: IEntityUpdates<TDocumentType, TEntity>;

    get all() {
        return [...this.adds.all(), ...this.updates.docs.all()];
    }

    successes_count: number;
    private readonly _idPropertyName: keyof TEntity;

    constructor(adds: ReadOnlyList<TEntity>, removes: ReadOnlyList<IRemovalRecord<TDocumentType, TEntity>>, updates: IEntityUpdates<TDocumentType, TEntity>, successes_count: number, idPropertyName: keyof TEntity) {
        this.adds = adds;
        this.removes = removes;
        this.updates = updates;
        this.successes_count = successes_count;
        this._idPropertyName = idPropertyName;
    }

    resolve(...entities: TEntity[]): typeof entities {

        const result: TEntity[] = [];
        for (const entity of entities) {
            const id = entity[this._idPropertyName] as keyof TEntity;

            if (this.adds.has(id)) {
                result.push(this.adds.get(id));
                continue;
            }

            if (this.updates.docs.has(id)) {
                result.push(this.updates.docs.get(id));
                continue;
            }

            if (this.removes.has(id)) {
                result.push(this.removes.get(id));
                continue;
            }

            result.push(entity);
        }

        return result;
    }
}