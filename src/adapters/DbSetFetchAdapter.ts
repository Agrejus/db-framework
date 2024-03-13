import { SearchResult } from '../common/SearchResult';
import { IDbSetFetchAdapter } from '../types/adapter-types';
import { IDbSetChangeTracker } from '../types/change-tracking-types';
import { EntitySelector } from '../types/common-types';
import { DbSetType, IDbSetProps } from '../types/dbset-types';
import { IDbRecord } from '../types/entity-types';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';

export class DbSetFetchAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TDbPlugin> extends DbSetBaseAdapter<TDocumentType, TEntity, TExclusions, TDbPlugin> implements IDbSetFetchAdapter<TDocumentType, TEntity, TExclusions> {

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, type: DbSetType, changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>) {
        super(props, type, changeTracker);
    }

    async all() {
        const data = await this.api.dbPlugin.all({ DocumentType: this.documentType });
        const filtered = this.filterSelector == null ? data : data.filter(this.filterSelector);
        return new SearchResult<TDocumentType, TEntity, TExclusions>(filtered, this.changeTracker);
    }

    async filter(selector: EntitySelector<TDocumentType, TEntity>) {
        const data = await this.all();
        return data.filter(selector);
    }

    async find(selector: EntitySelector<TDocumentType, TEntity>) {
        const data = await this.all();
        return data.find(selector);
    }

    async get(...ids: string[]) {
        const entities = await this.api.dbPlugin.getStrict(this.documentType, ...ids);
        const filtered = this.filterSelector == null ? entities : entities.filter(this.filterSelector);
        return new SearchResult<TDocumentType, TEntity, TExclusions>(filtered, this.changeTracker);
    }
}