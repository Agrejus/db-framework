import { Transaction } from '../common/Transaction';
import { IDbSetFetchAdapter, IDbSetModificationAdapter } from '../types/adapter-types';
import { IDbSetChangeTracker } from '../types/change-tracking-types';
import { ITrackedData } from '../types/context-types';
import { DbSetType, IDbSetProps, SaveChangesEventData } from '../types/dbset-types';
import { IDbRecord, OmittedEntity, IIndexableEntity } from '../types/entity-types';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';
import { DbSetSubscriptionsAdapter } from './DbSetSubscriptionsAdapter';
import { DbSetFetchAdapter } from './DbSetFetchAdapter';

export class DbSetModificationAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TDbPlugin> extends DbSetBaseAdapter<TDocumentType, TEntity, TExclusions, TDbPlugin> implements IDbSetModificationAdapter<TDocumentType, TEntity, TExclusions> {

    private _tag: unknown | null = null;
    protected readonly fetchAdapter: IDbSetFetchAdapter<TDocumentType, TEntity, TExclusions>;
    protected readonly subscriptionsAdapter: DbSetSubscriptionsAdapter<TDocumentType, TEntity, TExclusions>;
    public subscribe: typeof this.subscriptionsAdapter.subscribe;
    

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, type: DbSetType, idPropertyName: keyof TEntity, changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>) {
        super(props, type, changeTracker);
        this.fetchAdapter = new DbSetFetchAdapter<TDocumentType, TEntity, TExclusions, TDbPlugin>(props, type, idPropertyName, changeTracker);
        this.subscriptionsAdapter = new DbSetSubscriptionsAdapter<TDocumentType, TEntity, TExclusions>(props);
        this.subscribe = this.subscriptionsAdapter.subscribe.bind(this.subscriptionsAdapter);
        this.api.registerOnAfterSaveChanges(props.documentType, this.onAfterSaveChanges.bind(this));
    }

    hasSubscriptions() {
        return this.subscriptionsAdapter.getSubscribers().length > 0;
    }

    tag(value: unknown) {
        this._tag = value;
    }

    instance(...entities: OmittedEntity<TEntity, TExclusions>[]) {
        const enrich = this.changeTracker.enrichment.compose("documentType", "id", "defaultAdd", "enhance");
        return entities.map(entity => enrich(entity as TEntity));
    }

    protected async onAfterSaveChanges(getChanges: () => SaveChangesEventData<TDocumentType, TEntity>) {

        const subscribers = this.subscriptionsAdapter.getSubscribers();

        if (subscribers.length === 0) {
            return;
        }

        const { adds, removes, updates } = getChanges();

        if (adds.length === 0 && updates.length === 0 && removes.length === 0) {
            return;
        }

        for (const subscriber of subscribers) {
            if (subscriber.selector == null) {
                setTimeout(() => subscriber.callback(adds, updates, removes), 5);
                continue;
            }

            const selector = subscriber.selector;
            setTimeout(() => subscriber.callback(adds.filter(selector), updates.filter(selector), removes.filter(selector)), 5);
        }
    }

    private async _add(...entities: OmittedEntity<TEntity, TExclusions>[]) {
        const data = this.changeTracker.getTrackedData();
        const { adds, transactions } = data;
        const transaction = transactions.start("add");
        const enrich = this.changeTracker.enrichment.compose("documentType", "id", "defaultAdd", "changeTracking", "enhance");

        const result = entities.map(entity => {

            const canAddEntityResult = this.api.dbPlugin.isOperationAllowed(entity as any, "add");

            if (canAddEntityResult.ok === false) {
                throw new Error(canAddEntityResult.error ?? 'Cannot add entity')
            }

            const enrichedEntity = enrich(entity as TEntity);

            const id = enrichedEntity[this.api.dbPlugin.idPropertyName];
            this._tryAddMetaData(id);
            transaction.add(id as string | number);

            adds.push(enrichedEntity);

            return enrichedEntity;
        });

        return result
    }

    async add(...entities: OmittedEntity<TEntity, TExclusions>[]) {


        const result = await this._add(...entities);

        this._disposeMetaData();

        return result
    }

    private _tryAddMetaData(id: TEntity[keyof TEntity]) {
        if (this._tag != null) {
            this.api.tag(id, this._tag)
        }
    }

    private _disposeMetaData() {
        this._tag = null;
    }

    async upsert(...entities: (OmittedEntity<TEntity, TExclusions> | Omit<TEntity, "DocumentType">)[]) {

        const ids = entities.map(w => {

            const id = w[this.api.dbPlugin.idPropertyName as keyof (OmittedEntity<TEntity, TExclusions> | Omit<TEntity, "DocumentType">)] as string;

            // if we are missing an id, try to build it from the entity
            // if we are truly missing an id, it's an insert
            if (id == null) {
                const [instance] = this.instance(w as any)
                return instance[this.api.dbPlugin.idPropertyName] as string;
            }

            return id;
        }).filter(w => w != null);

        const allResult = await this.fetchAdapter.get(...ids);
        const all = allResult.toResult();
        const allDictionary: { [key: string]: TEntity } = all.reduce((a, v) => {

            const id = v[this.api.dbPlugin.idPropertyName] as string;
            return { ...a, [id]: v }
        }, {})
        const result: TEntity[] = [];

        const createEnricher = this.changeTracker.enrichment.compose("documentType", "id", "defaultAdd", "enhance");
        const upsertEnricher = this.changeTracker.enrichment.compose("defaultAdd", "deserialize", "changeTracking", "enhance");

        for (let entity of entities as any[]) {
            const instance = entity[this.api.dbPlugin.idPropertyName] != null ? entity as TEntity : createEnricher(entity) as TEntity;
            const id = instance[this.api.dbPlugin.idPropertyName] as string;
            const found = allDictionary[id]

            if (found) {
                const enriched = upsertEnricher(found);
                const [attached] = this.changeTracker.attach(enriched);

                try {
                    this.changeTracker.merge(entity, attached);
                } catch (e: any) {
                    if ('message' in e && typeof e.message === "string" && e.message.includes("object is not extensible")) {
                        throw new Error(`Cannot change property on readonly entity.  Readonly DbSets can only be added to, not updated, consider removing readonly from the DbSet.  DocumentType: ${this.documentType}.  Original Error: ${e.message}`)
                    }
                    throw e;
                }

                const mergedId = attached[this.api.dbPlugin.idPropertyName];
                this._tryAddMetaData(mergedId);

                result.push(attached)
                continue;
            }

            const [added] = await this._add(entity);

            result.push(added)
        }

        this._disposeMetaData();

        return result;
    }

    async remove(...ids: string[]): Promise<void>;
    async remove(...entities: TEntity[]): Promise<void>;
    async remove(...entities: any[]) {

        await this.onRemove();
        const data = this.changeTracker.getTrackedData();
        const transaction = data.transactions.start("remove");

        if (entities.some(w => typeof w === "string")) {

            await Promise.all(entities.map(w => this._removeById(w, transaction, data)));

            this._disposeMetaData();
            return;
        }

        await Promise.all(entities.map(w => this._remove(w, transaction, data)))

        this._disposeMetaData();
    }

    protected async onRemove() {

    }

    async empty() {
        const allResult = await this.fetchAdapter.all();
        const all = allResult.toResult();
        await this.remove(...all);
    }

    private async _remove(entity: TEntity, transaction: Transaction, data: ITrackedData<TDocumentType, TEntity>) {
        const { removes } = data;

        const ids = removes.map(w => w[this.api.dbPlugin.idPropertyName]);
        const indexableEntity = entity as IIndexableEntity;

        if (ids.includes(indexableEntity[this.api.dbPlugin.idPropertyName as string])) {
            throw new Error(`Cannot remove entity with same id more than once.  id: ${indexableEntity[this.api.dbPlugin.idPropertyName as string]}`)
        }

        const canAddEntityResult = this.api.dbPlugin.isOperationAllowed(entity, "remove");

        if (canAddEntityResult.ok === false) {
            throw new Error(canAddEntityResult.error ?? 'Cannot remove entity')
        }

        const id = entity[this.api.dbPlugin.idPropertyName];
        this._tryAddMetaData(id);
        removes.push(entity as any);
        transaction.add(id as string | number);
    }

    protected async _removeById(id: string, transaction: Transaction, data: ITrackedData<TDocumentType, TEntity>) {
        const { removesById } = data;

        if (removesById.map(w => w.key).includes(id)) {
            throw new Error(`Cannot remove entity with same id more than once.  id: ${id}`)
        }

        this._tryAddMetaData(id as any);

        transaction.add(id);
        removesById.push({ key: id, DocumentType: this.documentType });
    }
}