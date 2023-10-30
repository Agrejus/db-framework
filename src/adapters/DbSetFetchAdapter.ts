import { IDbSetFetchAdapter } from '../types/adapter-types';
import { EntitySelector } from '../types/common-types';
import { DbSetType, IDbSetProps } from '../types/dbset-types';
import { IDbRecord } from '../types/entity-types';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';

export class DbSetFetchAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> extends DbSetBaseAdapter<TDocumentType, TEntity, TExclusions> implements IDbSetFetchAdapter<TDocumentType, TEntity, TExclusions> {

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, type: DbSetType) {
        super(props, type);
    }

    async filter(selector: EntitySelector<TDocumentType, TEntity>) {
        const data = await this.allDataAndMakeTrackable();

        const result = [...data].filter(selector);

        await this.onAfterDataFetched(result);

        const attached = this.api.changeTrackingAdapter.attach(result)

        return attached;
    }

    async all() {
        return await this._all()
    }

    async get(...ids: string[]) {
        const entities = await this.api.dbPlugin.getStrict(...ids);
        const result = entities.map(w => this.api.changeTrackingAdapter.enableChangeTracking(w, this.defaults.retrieve, this.isReadonly, this.map));
        const filteredResult = this.filterResult(result)
        await this.onAfterDataFetched(filteredResult);

        if (filteredResult.length > 0) {
            return this.api.changeTrackingAdapter.attach(filteredResult)
        }

        return filteredResult;
    }


    async find(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity | undefined> {
        const data = await this.allDataAndMakeTrackable();
        const result = [...data].find(selector);

        if (result) {

            await this.onAfterDataFetched([result]);

            const [attached] = this.api.changeTrackingAdapter.attach([result]);

            return attached;
        }

        return result;
    }

    async first() {
        const data = await this.allDataAndMakeTrackable();
        const result = data[0];

        if (result) {

            await this.onAfterDataFetched([result]);

            const [attached] = this.api.changeTrackingAdapter.attach([result]);

            return attached;
        }

        return result as TEntity | undefined;
    }
}