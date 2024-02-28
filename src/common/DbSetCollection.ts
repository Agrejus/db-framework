import { DbSetMap, IDbSet } from "../types/dbset-types";
import { IDbRecord } from "../types/entity-types";

export class DbSetCollection<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase> {

    private readonly _dbsets: DbSetMap;

    constructor(dbsets: DbSetMap) {
        this._dbsets = dbsets;
    }

    get(documentType: TDocumentType) {
        return this._dbsets[documentType] as IDbSet<TDocumentType, TEntityBase, TExclusions>;
    }

    all() {
        return Object.values(this._dbsets);
    }

    filter(predicate: (dbset: IDbSet<TDocumentType, TEntityBase, TExclusions>, index: number, array: IDbSet<TDocumentType, TEntityBase, TExclusions>[]) => boolean) {
        return Object.values(this._dbsets).filter((w, i, a) => predicate(w as IDbSet<TDocumentType, TEntityBase, TExclusions>, i, a as IDbSet<TDocumentType, TEntityBase, TExclusions>[]));
    }
}