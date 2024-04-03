import { IDbRecord } from "@agrejus/db-framework";

export interface IFlexSyncRecord<TDocumentType extends string> extends IDbRecord<TDocumentType> {
    readonly _timestamp: number;
    readonly _revision: number;
}