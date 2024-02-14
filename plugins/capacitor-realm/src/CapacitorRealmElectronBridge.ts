import type { ICapacitorRealmPlugin, CapacitorRealmRecord, IRealmContext, RegisterSchemas, IRealmUser, IRealmContextOptions, IAllQueryOptions } from './definitions';
import type { IBulkOperationsResponse } from '@agrejus/db-framework';

const schemaMap: { [key: string]: new () => any } = {};

export const electronBridge = (Realm: IRealmContext): ICapacitorRealmPlugin & { registerSchemas: RegisterSchemas } => {

    const registerSchemas = async <TDocumentType extends string, TDocument extends CapacitorRealmRecord<TDocumentType>>(schemas: { [key in TDocumentType]: new () => TDocument }) => {
        for (const key in schemas) {
            schemaMap[key] = schemas[key];
        }
    }

    const getRealmInstance = (user?: IRealmUser) => {

        const schemas = Object.keys(schemaMap).map(w => schemaMap[w]);
        const filtered = Object.keys(schemaMap).filter(w => !(schemaMap[w] as any).schema?.embedded).map(w => schemaMap[w]);

        const options: IRealmContextOptions = {
            schema: schemas,
        }

        if (user != null) {
            options.sync = {
                user,
                flexible: true,
                initialSubscriptions: {
                    update: (subs, realm) => {
                        for(const Schema of filtered) {
                            subs.add(realm.objects(Schema), { name: Schema.name })
                        }
                    },
                    rerunOnOpen: true
                }
            }
        }

        return new Realm(options);
    }

    const destroy = async (user?: IRealmUser) => {
        const realm = getRealmInstance(user);

        realm.write(() => {
            realm.deleteAll();
        });

        realm.close();
    }

    const all = async <TDocumentType extends string, TDocument extends CapacitorRealmRecord<TDocumentType>>(options: IAllQueryOptions<TDocumentType>) => {
        if (options.payload?.DocumentType != null) {
            const realm = getRealmInstance(options.user);

            const all = realm.objects<TDocument & { toJSON(): TDocument }>(schemaMap[options.payload.DocumentType]);

            const result = all.map(w => w.toJSON());

            realm.close();
            return result as TDocument[];
        }

        const result: TDocument[] = [];

        const realm = getRealmInstance(options.user);

        const filtered = Object.keys(schemaMap).filter(w => !(schemaMap[w] as any).schema?.embedded).map(w => schemaMap[w]);

        for (const schema of filtered) {
            const docs = realm.objects<TDocument & { toJSON(): TDocument }>(schema);

            result.push(...docs.map(w => w.toJSON()))
        }

        realm.close();

        return result as TDocument[];
    }

    const bulkDocs = async <TDocumentType extends string, TDocument extends CapacitorRealmRecord<TDocumentType>>(operations: { adds: TDocument[]; removes: TDocument[]; updates: TDocument[]; }, user?: IRealmUser) => {
        const operationsByRealm: { [key in TDocumentType]: { adds: TDocument[]; removes: TDocument[]; updates: TDocument[]; } } = {} as any;

        for (const add of operations.adds) {

            if (operationsByRealm[add.DocumentType] == null) {
                operationsByRealm[add.DocumentType] = { adds: [], removes: [], updates: [] };
            }

            operationsByRealm[add.DocumentType].adds.push(add)
        }

        for (const update of operations.updates) {

            if (operationsByRealm[update.DocumentType] == null) {
                operationsByRealm[update.DocumentType] = { adds: [], removes: [], updates: [] };
            }

            operationsByRealm[update.DocumentType].updates.push(update)
        }

        for (const remove of operations.removes) {

            if (operationsByRealm[remove.DocumentType] == null) {
                operationsByRealm[remove.DocumentType] = { adds: [], removes: [], updates: [] };
            }

            operationsByRealm[remove.DocumentType].removes.push(remove)
        }

        const adds: TDocument[] = [];
        const removes: TDocument[] = []


        for (const schema in operationsByRealm) {
            const operations = operationsByRealm[schema]
            const RealmInstanceCreator = schemaMap[schema];

            const realm = getRealmInstance(user);

            realm.write(() => {
                if (operations.removes.length > 0) {
                    const ids = operations.removes.map(w => w._id)
                    const items = realm.objects(RealmInstanceCreator).filter(w => ids.includes(w._id));
                    realm.delete(items);

                    removes.push(...operations.removes)
                }
            });

            realm.write(() => {
                for (const doc of operations.adds) {
                    const newDocument = realm.create<TDocument & { toJSON(): TDocument }>(RealmInstanceCreator, doc as any);
                    adds.push(newDocument.toJSON());
                }

                for (const doc of operations.updates) {
                    const newDocument = realm.create<TDocument & { toJSON(): TDocument }>(RealmInstanceCreator, doc as any, "modified");
                    adds.push(newDocument.toJSON());
                }
            });

            realm.close();
        }

        const result: IBulkOperationsResponse = {
            errors: {},
            errors_count: 0,
            successes: adds.reduce((a, v) => ({ ...a, [v._id]: v }), {}),
            successes_count: adds.length
        }

        return result;
    }

    const get = async <TDocumentType extends string, TDocument extends CapacitorRealmRecord<TDocumentType>>(documentType: TDocumentType, ids: string[], user?: IRealmUser) => {
        const realm = getRealmInstance(user);

        const all = realm.objects<TDocument & { toJSON(): TDocument }>(schemaMap[documentType]);

        const result = all.filter(w => ids.includes(w._id as string)).map(w => w.toJSON());

        realm.close();

        return result as TDocument[];
    }

    const login = async (appId: string, username: string, password: string) => {
        const app = new Realm.App({ id: appId });
        const credentials = Realm.Credentials.anonymous();
        try {
            return await app.logIn(credentials);
        } catch (err) {
            console.error("Failed to log in", err);
        }
    }

    return {
        destroy,
        all,
        bulkDocs,
        get,
        registerSchemas,
        login
    }
}