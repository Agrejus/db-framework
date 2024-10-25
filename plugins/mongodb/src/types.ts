import { IDbPluginOptions, IDbRecord } from "@agrejus/db-framework";

export type MongoDbRecord<TDocumentType extends string> = {
    readonly id: string;
    readonly timestamp: number;
} & IDbRecord<TDocumentType>;

export interface IMongoDbPluginOptions extends IDbPluginOptions {
    connectionString: string;
}