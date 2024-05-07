import { DataContext, IDbPluginOptions, InferType } from "@agrejus/db-framework";
import { DocumentTypes } from '../..'
import { PouchDbPlugin, PouchDbRecord } from "@agrejus/db-framework-plugin-pouchdb";
import { v4 as uuidv4 } from 'uuid';
import { createComputerSchema } from "../../schema/computer";

const ComputerSchema = createComputerSchema("PouchDB");
type Computer = InferType<typeof ComputerSchema>

export class PouchDbSchemaContext extends DataContext<
    DocumentTypes,
    PouchDbRecord<DocumentTypes>,
    "_id" | "_rev",
    IDbPluginOptions,
    PouchDbPlugin<DocumentTypes, PouchDbRecord<DocumentTypes>, IDbPluginOptions>
> {

    constructor() {
        super({ dbName: `${uuidv4()}-db` }, PouchDbPlugin);
    }

    contextId() {
        return PouchDbSchemaContext.name;
    }

    computers = this.dbset().default<Computer>(DocumentTypes.Computers, ComputerSchema as any).create();
}