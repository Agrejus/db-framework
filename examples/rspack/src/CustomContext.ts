import { DataContext } from "@agrejus/db-framework"
import { DbPluginLogging } from "@agrejus/db-framework-core";
import { product } from "./schemas/product";
import { DexiePlugin } from "@agrejus/db-framework-plugin-dexie";

const plugin = new DexiePlugin("dexie-db");
const pluginWithLogging = DbPluginLogging.create(plugin);


export class CustomContext extends DataContext {

    constructor() {
        super(pluginWithLogging);
    }

    // constructor() {
    //     super(new MemoryPlugin())
    // }

    products = this.dbset(product).create();
}