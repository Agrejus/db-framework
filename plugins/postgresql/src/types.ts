import { IDbPluginOptions, IDbRecord } from "@agrejus/db-framework";

export type PostgreSqlRecord<TDocumentType extends string> = {
    readonly id: string;
    readonly timestamp: number;
} & IDbRecord<TDocumentType>;

export interface IPostgreSqlPluginOptions extends IDbPluginOptions {
    connectionString: string;
}