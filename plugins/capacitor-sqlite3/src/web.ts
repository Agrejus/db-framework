import { WebPlugin } from '@capacitor/core';
import type { ICapacitorSqlitePlugin, CapacitorSqliteRecord } from './definitions';
import { IQueryParams } from '@agrejus/db-framework';

declare var window: any;

export class CapacitorSqliteWeb extends WebPlugin implements ICapacitorSqlitePlugin {

  constructor() {
    super({ name: 'CapacitorSqlite', platforms: ['web'] });
  }

  async destroy() {
    if (typeof window.api !== "object" || typeof window.api.destroy !== "function") {
      throw new Error('CapacitorSqlite: window.api.destroy is not implemented')
    }

    return await window.api.destroy();
  }

  async all<TDocumentType extends string, TDocument extends CapacitorSqliteRecord<TDocumentType>>(payload?: IQueryParams<TDocumentType>): Promise<TDocument[]> {
    if (typeof window.api !== "object" || typeof window.api.all !== "function") {
      throw new Error('CapacitorSqlite: window.api.all is not implemented')
    }

    return await window.api.all(payload);
  }

  async get<TDocumentType extends string, TDocument extends CapacitorSqliteRecord<TDocumentType>>(...ids: string[]): Promise<TDocument[]> {
    if (typeof window.api !== "object" || typeof window.api.get !== "function") {
      throw new Error('CapacitorSqlite: window.api.get is not implemented')
    }

    return await window.api.get(...ids)
  }

  async bulkDocs<TDocumentType extends string, TDocument extends CapacitorSqliteRecord<TDocumentType>>(operations: { adds: TDocument[]; removes: TDocument[]; updates: TDocument[]; }) {

    if (typeof window.api !== "object" || typeof window.api.bulkDocs !== "function") {
      throw new Error('CapacitorSqlite: window.api.bulkDocs is not implemented')
    }

    return await window.api.bulkDocs(operations)
  }
} 