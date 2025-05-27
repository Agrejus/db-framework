import { DataContext } from "@agrejus/db-framework";
import { DbPluginLogging } from "@agrejus/db-framework-core";
import { product } from "./schemas/product";
import { PouchDbPlugin, toMango, setQueryOptions } from "@agrejus/db-framework-plugin-pouchdb";

const pouchDbPlugin = new PouchDbPlugin("test-db");
const pouchDbPluginWithLogging = DbPluginLogging.create(pouchDbPlugin).setHook("onQueryRequest", (data) => {
    if (data.query.expression != null) {

        const request = {
            selector: {}
        };

        request.selector = toMango(data.query.expression);

        setQueryOptions(data.query.options, request);

        data.query.mango = request;
    }
})

export class CustomContext extends DataContext {

    constructor() {
        super(pouchDbPluginWithLogging);
    }

    // constructor() {
    //     super(new MemoryPlugin())
    // }

    products = this.dbset(product).create();
}