import { DbSetChangeType, DbSetOnChangeEvent, DbSetType, EntityAndTag, IStoreDbSetProps, SaveChangesEventData } from "../../types/dbset-types";
import { IDbRecord, OmittedEntity } from "../../types/entity-types";
import { DbSetModificationAdapter } from "../DbSetModificationAdapter";
import { CacheDataStore } from '../../cache/CacheDataStore';

export class DbSetStatefulModificationAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> extends DbSetModificationAdapter<TDocumentType, TEntity, TExclusions> {

    private _store: CacheDataStore<TDocumentType, TEntity>;
    private _onChange: DbSetOnChangeEvent<TDocumentType, TEntity> | null;
    private _remotes: TEntity[] = [];

    constructor(props: IStoreDbSetProps<TDocumentType, TEntity, TExclusions>, type: DbSetType) {
        super(props, type);
        this._onChange = props.onChange
        this._store = new CacheDataStore<TDocumentType, TEntity>(this.api.dbPlugin.idPropertName);
    }

    protected override async onAfterSaveChanges(getChanges: () => SaveChangesEventData<TDocumentType, TEntity>) {

        const { adds, removes, updates } = getChanges();

        const addedEntities = adds.map(w => w.entity);
        const updatedEntities = updates.map(w => w.entity);
        const removedEntities = removes.map(w => w.entity);
        const remotes = this._remotes;

        this._store.putMany(...addedEntities);
        this._store.putMany(...updatedEntities);
        this._store.putMany(...remotes);
        this._store.removeMany(...removedEntities);

        this._remotes = []; // remove the remotes after save

        this._fireOnChangeWithLocalData("change", { adds: addedEntities, removes: removedEntities, updates: updatedEntities, all: this._store.all(), remotes });
    }

    private _fireOnChangeWithLocalData(type: DbSetChangeType, changes: { adds: TEntity[], removes: TEntity[], updates: TEntity[], remotes: TEntity[], all: TEntity[] }) {
        if (this._onChange) {
            this._onChange(this.documentType, type, changes)
        }
    }

    async addRemote(...entities: OmittedEntity<TEntity, TExclusions>[]) {
        const remotes = super.instance(...entities);
        this._remotes.push(...remotes)
        return remotes;
    }

    async hydrate() {
        const all = await this._all();

        this._store.putMany(...all);

        this._fireOnChangeWithLocalData("hydrate", { adds: [], removes: [], updates: [], remotes: [], all });

        return all.length;
    }

    getStoreData() {
        return this._store.all()
    }
}