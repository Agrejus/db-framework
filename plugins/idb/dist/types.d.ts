import { IDbRecord } from '@agrejus/db-framework';
export type IndexedDbRecord<TDocumentType extends string> = {
    readonly _id: string;
    readonly _timestamp: string;
} & IDbRecord<TDocumentType>;
