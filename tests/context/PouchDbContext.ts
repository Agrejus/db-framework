import { DataContext, IDbPluginOptions } from "../../src";
import { DocumentTypes } from '..'
import { PouchDbPlugin, PouchDbRecord } from "../../plugins/pouchdb";
import { v4 as uuidv4 } from 'uuid';

export class PouchDbContext extends DataContext<
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
        return PouchDbContext.name;
    }

}