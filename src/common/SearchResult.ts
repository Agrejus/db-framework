import { IDbSetChangeTracker } from "../types/change-tracking-types";
import { EntitySelector } from "../types/common-types";
import { IDbRecord } from "../types/entity-types";

export class SearchResult<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {

    private readonly _data: TEntity[];
    private readonly _changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>;
    private readonly _onAfterDataFetched: (data: TEntity[]) => Promise<void>;

    constructor(data: TEntity[], changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>, onAfterDataFetched: (data: TEntity[]) => Promise<void>) { 
        this._data = data;
        this._changeTracker = changeTracker;
        this._onAfterDataFetched = onAfterDataFetched;
    }

    filter(selector: EntitySelector<TDocumentType, TEntity>) {
        return new SearchResult(this._data.filter(selector), this._changeTracker, this._onAfterDataFetched);
    }

    find(selector: EntitySelector<TDocumentType, TEntity>) {
        const found = this._data.find(selector);

        if (found) {
            return new SearchResult([found], this._changeTracker, this._onAfterDataFetched);
        }

        return new SearchResult([], this._changeTracker, this._onAfterDataFetched);
    }

    isEmpty() {
        return this._data.length === 0;
    }

    toTrackable() {
        const enrich = this._changeTracker.enrichment.compose("deserialize", "defaultRetrieve", "changeTracking", "enhance");

        const enrichedData = this._data.map(enrich);

        return new SearchResult(enrichedData, this._changeTracker, this._onAfterDataFetched);
    }

    toResult() {
        return this._data;
    }

    async toAttached() {

        if (this._data.length === 0) {
            return [];
        }

        const attached = this._changeTracker.attach(...this._data);

        await this._onAfterDataFetched(attached);

        return attached;
    }
}