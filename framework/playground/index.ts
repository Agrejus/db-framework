import { s } from "@agrejus/db-framework-core";
import { DataContext } from "../src/DataContext";

const model = s.define("MY_TABLE", {
    _id: s.string().key(),
    _rev: s.string().identity(),
    name: s.string(),
    year: s.number(),
    date: s.date().default(new Date()).deserialize(w => new Date(w)).serialize(w => w.toISOString())
}).
    modify(w => ({
        test: w.computed(w => w._id),
        toString: w.function(w => w.date.toISOString()),
        documentType: w.computed((_, t) => t).tracked()
    })).
    compile();

const nested = s.define("MY_NESTED_TABLE", {
    _id: s.string().key().identity(),
    _rev: s.string().identity(),
    name: s.string(),
    child: s.object({
        name: s.string()
    })
}).modify(w => ({
    documentType: w.computed((_, t) => t).tracked()
})).compile();

class Ctx extends DataContext {

    constructor() {
        super(null as any);
    }

    test = this.dbset(model).stateful();
    nested = this.dbset(nested);
}

const ctx = new Ctx();

const r = async () => {
    // map needs to exclude function property names that are computed when using param queries
    debugger;
    // await ctx.test.map(w => w._id).firstOrUndefinedAsync();
    // await ctx.test.map(w => ({ _id: w._id, date: w.date })).firstOrUndefinedAsync();
    const name = "James"

    // Subscribe must only return callback selectors, not Async ones
    const unsubscribe = ctx.test.where(w => w.name == "James").subscribe().firstOrUndefined((r, e) => {

    });
    const q = ctx.test.where(w => w.name === name).map(w => ({ documentType: w.documentType, _id: w._id })).toArrayAsync();
    //const q = ctx.test.where(([w, p]) => w.name === p.name, { name: "James" }).map(w => w.documentType).toArrayAsync();
    let count = 0;
    const id = setInterval(() => {
        count++;

        if (id != null && count >= 100) {
            clearInterval(id);
        }
    }, 500)
}

r();
