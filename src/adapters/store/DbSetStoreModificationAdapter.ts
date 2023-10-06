import { DbSetChangeType, DbSetOnChangeEvent, DbSetType, EntityAndTag, IStoreDbSetProps } from "../../types/dbset-types";
import { IDbRecord } from "../../types/entity-types";
import { DbSetModificationAdapter } from "../DbSetModificationAdapter";
import { CacheDataStore } from '../../cache/CacheDataStore';

export class DbSetStoreModificationAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> extends DbSetModificationAdapter<TDocumentType, TEntity, TExclusions> {

    private _store: CacheDataStore<TDocumentType, TEntity>;
    private _onChange: DbSetOnChangeEvent<TDocumentType, TEntity> | null;

    constructor(props: IStoreDbSetProps<TDocumentType, TEntity, TExclusions>, type: DbSetType) {
        super(props, type);
        this._onChange = props.onChange
        this._store = new CacheDataStore<TDocumentType, TEntity>(this.api.dbPlugin.idPropertName);
    }

    protected override async onAfterSaveChanges(getChanges: () => { adds: EntityAndTag<TEntity>[]; removes: EntityAndTag<TEntity>[]; updates: EntityAndTag<TEntity>[]; }) {

        const { adds, removes, updates } = getChanges();

        this._store.putMany(...adds.map(w => w.entity));
        this._store.putMany(...updates.map(w => w.entity));
        this._store.removeMany(...removes.map(w => w.entity));

        this._fireOnChangeWithLocalData("change", { adds: adds.map(w => w.entity), removes: removes.map(w => w.entity), updates: updates.map(w => w.entity), all: this._store.all() });
    }

    private _fireOnChangeWithLocalData(type: DbSetChangeType, changes: { adds: TEntity[], removes: TEntity[], updates: TEntity[], all: TEntity[] }) {
        if (this._onChange) {
            this._onChange(this.documentType, type, changes)
        }
    }

    async hydrate() {
        const all = await this._all();

        this._store.putMany(...all);

        this._fireOnChangeWithLocalData("hydrate", { adds: [], removes: [], updates: [], all });

        return all.length;
    }

    getStoreData() {
        return this._store.all()
    }
}