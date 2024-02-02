import { IDbRecord } from "@agrejus/db-framework";

export type MemoryDbRecord<TDocumentType extends string> = {
    readonly id: string;
    readonly rev: string;
} & IDbRecord<TDocumentType>