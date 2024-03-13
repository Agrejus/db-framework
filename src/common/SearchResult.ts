import { IDbSetChangeTracker } from "../types/change-tracking-types";
import { EntitySelector } from "../types/common-types";
import { IDbRecord } from "../types/entity-types";

export class SearchResult<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {

    private readonly _data: TEntity[];
    private readonly _changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>;

    constructor(data: TEntity[], changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>) {
        this._data = data;
        this._changeTracker = changeTracker;
    }

    filter(selector: EntitySelector<TDocumentType, TEntity>) {
        return new SearchResult(this._data.filter(selector), this._changeTracker);
    }

    find(selector: EntitySelector<TDocumentType, TEntity>) {
        const found = this._data.find(selector);

        if (found) {
            return new SearchResult([found], this._changeTracker);
        }

        return new SearchResult([], this._changeTracker);
    }

    isEmpty() {
        return this._data.length === 0;
    }

    toTrackable() {
        const enrich = this._changeTracker.enrichment.compose("deserialize", "defaultRetrieve", "changeTracking", "enhance");

        const enrichedData = this._data.map(enrich);

        return new SearchResult(enrichedData, this._changeTracker);
    }

    toResult() {
        return this._data;
    }

    toAttached() {

        if (this._data.length === 0) {
            return [];
        }

        return this._changeTracker.attach(...this._data);
    }
}