import { WebPlugin } from '@capacitor/core';
import type { ICapacitorRealmPlugin, CapacitorRealmRecord, IRealmUser, IAllQueryOptions } from './definitions';

declare var window: {
  api: ICapacitorRealmPlugin
};

export class CapacitorRealmWeb extends WebPlugin implements ICapacitorRealmPlugin {

  constructor() {
    super({ name: 'CapacitorRealm', platforms: ['web'] });
  }

  async login(appId: string, username: string, password: string) {

    if (typeof window.api !== "object" || typeof window.api.login !== "function") {
      throw new Error('CapacitorRealm: window.api.login is not implemented')
    }

    return await window.api.login(appId, username, password);
  }

  async destroy(user?: IRealmUser) {
    if (typeof window.api !== "object" || typeof window.api.destroy !== "function") {
      throw new Error('CapacitorRealm: window.api.destroy is not implemented')
    }

    return await window.api.destroy(user);
  }

  async all<TDocumentType extends string, TDocument extends CapacitorRealmRecord<TDocumentType>>(options: IAllQueryOptions<TDocumentType>): Promise<TDocument[]> {
    if (typeof window.api !== "object" || typeof window.api.all !== "function") {
      throw new Error('CapacitorRealm: window.api.all is not implemented')
    }

    return await window.api.all(options);
  }

  async get<TDocumentType extends string, TDocument extends CapacitorRealmRecord<TDocumentType>>(documentType: TDocumentType, ids: string[], user?: IRealmUser): Promise<TDocument[]> {
    if (typeof window.api !== "object" || typeof window.api.get !== "function") {
      throw new Error('CapacitorRealm: window.api.get is not implemented')
    }

    return await window.api.get(documentType, ids, user)
  }

  async bulkDocs<TDocumentType extends string, TDocument extends CapacitorRealmRecord<TDocumentType>>(operations: { adds: TDocument[]; removes: TDocument[]; updates: TDocument[]; }, user?: IRealmUser) {

    if (typeof window.api !== "object" || typeof window.api.bulkDocs !== "function") {
      throw new Error('CapacitorRealm: window.api.bulkDocs is not implemented')
    }

    return await window.api.bulkDocs(operations, user)
  }
} 