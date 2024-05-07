import { DataContext, IDbPluginOptions, InferType } from "@agrejus/db-framework";
import { DocumentTypes } from '../..'
import { LocalStorageDbPlugin, LocalStorageDbRecord } from "@agrejus/db-framework-plugin-local-storage";
import { v4 as uuidv4 } from 'uuid';
import { createComputerSchema } from "../../schema/computer";


const ComputerSchema = createComputerSchema("LocalStorage");
type Computer = InferType<typeof ComputerSchema>

export class LocalStorageSchemaContext extends DataContext<
    DocumentTypes,
    LocalStorageDbRecord<DocumentTypes>,
    "id" | "rev",
    IDbPluginOptions,
    LocalStorageDbPlugin<DocumentTypes, LocalStorageDbRecord<DocumentTypes>, IDbPluginOptions>
> {

    constructor() {
        super({ dbName: `${uuidv4()}-db` }, LocalStorageDbPlugin);
    }

    contextId() {
        return LocalStorageSchemaContext.name;
    }

    computers = this.dbset().default<Computer>(DocumentTypes.Computers, ComputerSchema as any).create();
}