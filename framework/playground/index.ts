import { createUUID } from '@agrejus/db-framework-core/dist/utilities';
import { DataContext } from '../src/DataContext';
import { CompiledSchema, ExpandedProperty, InferCreateType, InferSchema, InferType, s, SchemaTypes } from '@agrejus/db-framework-core/src/schema';
import { performance } from 'perf_hooks';

const model = s.define("MY_TABLE", {
    id: s.string().key().default(createUUID),
    secondary: s.number().key().identity(),
    name: s.string().readonly(),
    year: s.number().default(() => 500),
    date: s.date().deserialize(function (e) { return new Date(e); }).serialize(x => x.toISOString()),
    operators: s.array<string>(),
    phone: s.string(),
    nested: s.object({
        id: s.number(),
        value: s.boolean().default(false),
        more: s.object({
            id: s.number().readonly()
        })
    })
}).append(w => ({
    test: w.function((w, a) => w.name),
    toString: w.function(function (w, a) { return w; }),
    documentType: w.computed((w, t) => t)
}));

const c = model.compile();

const enriched = c.enrich({
    id: 1,
    secondary: 1,
    name: "test",
    year: 1,
    date: "01/01/2024 8:00 AM",
    operators: [],
    nested: {
        id: 1,
        value: true,
        more: {
            id: 1
        }
    }
} as any);


enriched.name = "winner";

console.log(enriched.test());
console.log(enriched.toString());


let ct = 0;
let total = 0;
for (let i = 0; i < 1000; i++) {
    ct++;

    const start2 = performance.now();

    // JSON.parse(JSON.stringify({
    //     id: 1,
    //     secondary: 1,
    //     name: "test",
    //     address: {
    //         city: "Prior Lake",
    //         state_id: 1,
    //         state: {
    //             id: 1,
    //             name: "MN"
    //         },
    //         street: "21479 Dorothy Way",
    //         zip: 55372
    //     },
    //     phone: "612-403-5278",
    //     year: 1,
    //     date: new Date(),
    //     operators: [],
    //     nested: {
    //         id: 1,
    //         value: true,
    //         more: {
    //             id: 1
    //         }
    //     },
    //     documentType: "test",
    //     test: () => 1,
    //     toString: () => ""
    // }))
    total += (performance.now() - start2);

}

console.log(total / ct);


// ^^^ needs a .build/.prepare step so we don't need to keep evaluating all the time.
// CAN we do this internally and cache?  I think so since its in the same file

type MyTableSchema = InferSchema<typeof c>;
type MyTableModel = InferType<typeof c>;
type MyTableCreateModel = InferCreateType<typeof model>;
const x: MyTableSchema = null as any;

/*
add in custom change tracking
add immutable/readonly change tracking (add/remove only, no update)
*/


class Ctx extends DataContext {

    constructor() {
        super("" as any);
    }

    test = this.dbset(c);
}

// maybe use a db context factory?  That way we can quickly get a new db context
// from the cache vs creating a new one
const ctx = new Ctx();

const table = "my_table_sss";

// useParams will automatically use function destructuring
// If not, use default mechanism of selecting all

const run = async () => {
    // const rr = await ctx.test.useParams({ table }).findAsync(([w, p]) => w.documentType === p.table);
    // const rrr = await ctx.test.findAsync(w => w.documentType == "");

    const a = {
        date: new Date(),
        name: "",
        nested: {
            id: 1,
            more: {
                id: 1
            },
        },
        operators: [],
        phone: ""
    };
    const [add] = await ctx.test.addAsync(a)

    debugger;
    console.log(add)
    await ctx.saveChangesAsync();
    console.log(add)

    const r = ctx.test.filter(w => w.documentType === table, () => void (0), () => void (0));
}

run();