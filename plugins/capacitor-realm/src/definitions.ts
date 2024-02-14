import type { IBulkOperationsResponse, IQueryParams, IDbRecord, IDbPluginOptions } from '@agrejus/db-framework'

export type CapacitorRealmRecord<TDocumentType extends string> = {
  readonly _id: string;
  readonly _rev: string;
} & IDbRecord<TDocumentType>

export type RegisterSchemas = <TDocumentType extends string, TDocument extends CapacitorRealmRecord<TDocumentType>>(schemas: { [key in TDocumentType]: new () => TDocument }) => Promise<void>

export interface ICapacitorRealmPluginOptions extends IDbPluginOptions {
  user: IRealmUser
}

export interface IAllQueryOptions<TDocumentType extends string> {
  user?: IRealmUser;
  payload?: IQueryParams<TDocumentType>;
}

export interface ICapacitorRealmPlugin {
  bulkDocs<TDocumentType extends string, TDocument extends CapacitorRealmRecord<TDocumentType>>(operations: { adds: TDocument[]; removes: TDocument[]; updates: TDocument[]; }, user?: IRealmUser): Promise<IBulkOperationsResponse>;
  get<TDocumentType extends string, TDocument extends CapacitorRealmRecord<TDocumentType>>(documentType: TDocumentType, ids: string[], user?: IRealmUser): Promise<TDocument[]>;
  destroy(user?: IRealmUser): Promise<void>;
  all<TDocumentType extends string, TDocument extends CapacitorRealmRecord<TDocumentType>>(options: IAllQueryOptions<TDocumentType>): Promise<TDocument[]>;
  login(appId: string, username: string, password: string): Promise<IRealmUser>;
}

export interface IRealmUser {

}

export interface IRealmCredentials {
  anonymous(): IRealmCredentials;
  emailPassword(email: string, password: string): IRealmCredentials
}

export interface IRealmApp {
  new(options: { id: string }): IRealmApp;
  logIn(credentials: IRealmCredentials): Promise<IRealmUser>;
}

export interface IMutableSubscriptionSet {
  add(entity: any, options: { name: string }): void;
}

export interface IInitialSubscription {
  update: (mutableSubscriptions: IMutableSubscriptionSet, realm: IRealmContext) => void;
  rerunOnOpen?: boolean;
}

export interface IRealmSyncOptions {
  flexible: true;
  user: IRealmUser;
  partitionValue?: string;
  initialSubscriptions?: IInitialSubscription;
}
export interface IRealmContextOptions {
  schema: (new () => any)[],
  sync?: IRealmSyncOptions
}

export interface IRealmContext {
  new(options?: IRealmContextOptions): IRealmContext;
  open(options?: IRealmContextOptions): Promise<IRealmContext>;
  write(transaction: () => void): void;
  deleteAll(): void;
  close(): void;
  objects<T>(schema: new () => T): T[];
  create<T>(schema: new () => any, doc: T, changeType?: "modified"): T;
  delete<T>(doc: T): void;
  App: IRealmApp;
  Credentials: IRealmCredentials;
  subscriptions: {
    update: (callback: (subscription: IMutableSubscriptionSet) => void) => Promise<void>;
  }
}

export interface IIPCMain {
  handle(eventType: string, ...args: any): Promise<any>
}

export interface IIPCRenderer {
  invoke(eventType: string, ...args: any): Promise<any>
}



// Create a Query and Add it to your Subscriptions
// await realm.subscriptions.update((mutableSubscriptions) => {
//   mutableSubscriptions.add(
//     realm
//       .objects(ListingSchema.name)
//       .filtered("location = 'dallas' && price < 300000 && bedrooms = 3", {
//         name: "home-search",
//       })
//   );
// });

