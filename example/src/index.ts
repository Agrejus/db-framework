import { DataContext } from "@agrejus/db-framework";
import { s, InferType, DbPluginLogging } from "@agrejus/db-framework-core";
import { MemoryPlugin } from "@agrejus/db-framework-plugin-memory";
import { PouchDbPlugin, toMango, setQueryOptions } from "@agrejus/db-framework-plugin-pouchdb";
import { performance } from 'perf_hooks'
import { faker } from '@faker-js/faker';
import PouchDB from 'pouchdb';

// const model = s.define("MY_TABLE", {
//     _id: s.string().key().default((i) => i.createUUID(64), { createUUID }),
//     _rev: s.string().identity(),
//     name: s.string(),
//     year: s.number(),
//     date: s.date().default(new Date()).deserialize(w => new Date(w)).serialize(w => w.toISOString())
// }).modify(w => ({
//     test: w.computed(w => w._id),
//     toString: w.function(w => w.date.toISOString()),
//     documentType: w.computed((_, t) => t).tracked()
// })).compile();

// const obj = {
//     one: faker.number.int({ min: 1, max: 1000 }),
//     two: faker.word.sample(),
//     three: faker.date.recent(),
//     four: faker.lorem.sentence(1000),
//     five: {
//         one: faker.number.int({ min: 100, max: 1000 }),
//         two: faker.date.future(),
//         three: {
//             one: faker.location.streetAddress(),
//             two: faker.number.int({ min: 100000, max: 999999 })
//         }
//     }
// }


// const toString = (o: any) => {
//     const { one, two, three, four, five } = o;
//     const { one: fiveOne, two: fiveTwo, three: fiveThree } = five;
//     const { one: threeOne, two: threeTwo } = fiveThree;

//     return `{one:${one},two:${two},three:${three.toDateString()},four:${four},five:{one:${fiveOne},two:${fiveTwo.toISOString()},three:{one:${threeOne},two:${threeTwo}}}}`;
// }

// const array = new Array(10000).fill(obj);
// console.log(array)
// const s1 = performance.now();

// // JSON.stringify(array);
// const result = new Array(array.length);
// for (let i = 0; i < array.length; i++) {
//     result[i] = toString(array[i]);
// }
// const final = `[${result.join(",")}]`;


// console.log(performance.now() - s1);


const nested = s.define("products", {
    _id: s.string().key().identity(),
    more: s.object({
        one: s.string(),
        two: s.string()
    }),
    _rev: s.string().identity(),
    order: s.number().default((d) => d.test, { test: 1 }),
    name: s.string(),
    child: s.object({
        name: s.string(),
        nested: s.object({
            winner: s.number(),
            more: s.object({
                final: s.number(),
                array: s.array(s.string())
            })
        })
    })
}).modify(w => ({
    documentType: w.computed((_, t) => t).tracked()
})).compile();

type Test = InferType<typeof nested>;



// const modelWithDate = s.define("MY_DATE_TABLE", {
//     _id: s.string().key().identity(),
//     _rev: s.string().identity(),
//     date: s.date().default(new Date()).deserialize(w => new Date(w)).serialize(w => w.toISOString()),
//     name: s.string()
// }).modify(w => ({
//     documentType: w.computed((_, t) => t).tracked()
// })).compile();

const memoryPlugin = new MemoryPlugin();
const memoryPluginWithLogging = DbPluginLogging.create(memoryPlugin);
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

class Ctx extends DataContext {

    constructor() {
        super(pouchDbPluginWithLogging);
    }

    // test = this.dbset(model).create();
    nested = this.dbset(nested).create();
    // date = this.dbset(modelWithDate).create();
}

// HOW CAN WE PUSH UPDATES TO THE DBSET FROM THE PLUGIN?
const r = async () => {
    try {
        // need to make sure we are handling enriching and merging correctly,
        // they are not taking into account defaults

        // const db = new PouchDB("test-db");

        debugger;
        const ctx = new Ctx();


        // await ctx.date.addAsync({
        //     name: "James"
        // });

        // await ctx.saveChangesAsync();
        const xx2 = await ctx.nested.firstOrUndefinedAsync(w => w.name === "James");
        debugger;
        const xx5 = await ctx.nested.sort(w => w.name).firstOrUndefinedAsync(w => w._id !== "");
        const xx = await ctx.nested.sort(w => w.name).sort(w => w.order).firstOrUndefinedAsync(w => w._id === "");
        const xx1 = await ctx.nested.firstOrUndefinedAsync(w => w.name === "");

        const xx3 = await ctx.nested.firstOrUndefinedAsync(w => w.order >= 100);
        const xx4 = await ctx.nested.sort(w => w.name).sort(w => w.order).firstOrUndefinedAsync(w => w._id !== "");
        console.log(xx, xx1, xx2, xx3, xx4, xx5);

        await ctx.nested.addAsync({
            child: {
                name: "Child Name",
                nested: {
                    more: {
                        array: ["test"],
                        final: 1
                    },
                    winner: 100
                }
            },
            name: "James",
            more: {
                one: "one",
                two: "two"
            },
            order: 100
        });

        await ctx.saveChangesAsync();
        //const r3 = await ctx.nested.where(w => w.name == "James").map(w => w.name).firstOrUndefinedAsync();

        // why is this not working? we are falling back to non expression querying, we should be using it!
        const r4 = await ctx.nested.where(w => w.order === 100).map(w => w.order).sumAsync();
        console.log(r4);

        const r1 = await ctx.nested.where(w => w.name == "James").firstOrUndefinedAsync();
        const r2 = await ctx.nested.where(([w, d]) => w.name == d.name, { name: "James" }).firstOrUndefinedAsync();


        await ctx.nested.where(w => w.name == "James").firstOrUndefinedAsync();


        // const s1 = performance.now();
        // ctx.nested.where(w => w.name == "James").firstOrUndefined((r, e) => {
        //     console.log('DONE 1', performance.now() - s1, r, e)
        // });

        // const s2 = performance.now();
        // ctx.nested.where(w => w.name == "James").firstOrUndefined((r, e) => {
        //     console.log('DONE 2', performance.now() - s2, r, e)
        // });

        ctx.nested.where(w => w.name == "James").subscribe().map(w => w.order).sum((r, e) => {
            console.log('SUBSCRIBED', r, e)
        });

        // const [result] = await ctx.nested.addAsync({
        //     name: "",
        //     order: 1,
        //     child: {
        //         name: "",
        //         nested: {
        //             more: {
        //                 array: [],
        //                 final: 1
        //             },
        //             winner: 1
        //         }
        //     },
        //     more: {
        //         one: "one",
        //         two: "two"
        //     }
        // });

        // await ctx.saveChangesAsync();

        // we need to stop returning a new Data Access manager, can we put this in the plugin instead?
        const unsubscribe = ctx.nested.where(w => w.name == "James").subscribe().toArray((r, e) => {

        });

        for (let i = 0; i < 500; i++) {
            await ctx.nested.addAsync({
                name: `James ${i}`,
                order: i * 100,
                child: {
                    name: "",
                    nested: {
                        more: {
                            array: [],
                            final: i
                        },
                        winner: i
                    }
                },
                more: {
                    one: "one",
                    two: "two"
                }
            });
        }


        // const [added] =  await ctx.test.addAsync({
        //     name: "James8",
        //     year: 2024
        // });
        //  unsubscribe();
        await ctx.saveChangesAsync();
        // let's not run prepare when getting changes. 
        // after we call 'getChanges', we should call prepare on the adds and return a new object, then
        // we can merge on the result and merge the resulting object.  We can forget about the object we send 
        // over to save


        // looks like PDB always returns 1 document when limit is 1... wtf?


        const x9 = await ctx.nested.toArrayAsync();


        const x = await ctx.nested.firstOrUndefinedAsync(w => w.child.name == "test");

        const x1 = await ctx.nested.where(w => w.child.name.startsWith("other")).toArrayAsync();

        // Weird stuff is happening here
        // we are trying to auto create indexes
        // const x3 = await ctx.nested.order(w => w.order).toArrayAsync();
        // const x2 = await ctx.nested.order(w => w.name).toArrayAsync();

        const xxx = await ctx.nested.firstOrUndefinedAsync(w => w._id === x9[0]._id);

        // we need to have a dbset return a new queryable object and not reuse
        const s = await ctx.nested.someAsync(([w, p]) => w.name === p.name, { name: "James6" });

        const foundOne = await ctx.nested.firstOrUndefinedAsync(w => w._id == "test");





        const found = await ctx.nested.where(([w, p]) => w.name.startsWith(p.name), { name: "James" })
            .sort(w => w._id)
            .map(w => ({ name: w.name, _id: w._id }))
            .toArrayAsync();

        console.log(found)




        // ctx.test.find(w => w.name === added.name, async (r, e) => {  
        //     console.log("FOUND", r, added, e);

        //     added.name = "changed";

        //     ctx.saveChanges((r1, e1) => {
        //         console.log(r1, e1)
        //     });

        //     if (r != null) {
        //         // ctx.test.remove([r], (d, ee) => {
        //         //     ctx.saveChangesAsync();
        //         // })
        //     }
        // });
        // console.log(added);
        // debugger;
        //  await ctx.saveChangesAsync();
        // debugger;
        // console.log(added);

        // console.log(added.toString())

        let count = 0;
        const id = setInterval(() => {
            count++;
            console.log(count);
            if (count >= 50 && id != null) {
                clearInterval(id);
            }

        }, 500)
    } catch (e) {
        debugger;
        console.log(e)
    }
}

r();
// maybe use a db context factory?  That way we can quickly get a new db context
// from the cache vs creating a new one


// const run = async () => {
//     const ctx = new Ctx();

//     let total = 0;
//     let runs = 0;
//     const ss = performance.now();
//     for (let i = 0; i < 1500; i++) {
//         runs++;
//         const s = performance.now();
//         ctx.test.add([{
//             name: "James",
//             year: 2024
//         }], () => {}, () => {});

//         total += performance.now() - s;
//     }

//     console.log(performance.now() - ss)
// }

// run();

// const ctx = new Ctx();

// const profileExecution = async (iterations: number) => {
//     const data = [{ name: "James", year: 2024 }];
//     let totalTime = 0;

//     let low = 100;
//     let high = 0;

//     for (let i = 0; i < iterations; i++) {
//         const start = performance.now(); // Start time
//         await new Promise((resolve, reject) => {
//             ctx.test.add(data, (r, e) => {
//                 if (e != null) {
//                     reject(e);
//                     return;
//                 }

//                 resolve(r);
//             });
//         });
//         const end = performance.now(); // End time
//         const total = end - start;

//         if (total > high) {
//             high = total;
//         }

//         if (total < low) {
//             low = total;
//         }

//         totalTime += total;
//     }

//     const averageTime = totalTime / iterations;
//     console.log(`Average execution time: ${averageTime.toFixed(4)}ms, Total execution time: ${totalTime.toFixed(4)}ms, H: ${high.toFixed(4)}, L: ${low.toFixed(4)}`);

//     await new Promise((resolve, reject) => {
//         const saveStart = performance.now();
//         ctx.saveChanges((r, e) => {
//             if (e != null) {
//                 reject(e);
//                 return;
//             }
//             console.log(`Save execution time: ${(performance.now() - saveStart).toFixed(4)}ms`);
//             resolve(r);
//         });
//     });

// };

// Run the profiler with the desired number of iterations
// profileExecution(1000);