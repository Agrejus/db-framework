import { DataContext } from "@agrejus/db-framework";
import { s, createUUID } from "@agrejus/db-framework-core";
import { PouchDbPlugin } from "@agrejus/db-framework-plugin-pouchdb";
import { performance } from 'perf_hooks'

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

const nested = s.define("MY_NESTED_TABLE", {
    _id: s.string().key().identity(),
    _rev: s.string().identity(),
    order: s.number().default((d) => d.test, { test: 1 }),
    name: s.string(),
    child: s.object({
        name: s.string(),
        nested: s.object({
            winner: s.number(),
            more: s.object({
                final: s.number(),
                array: s.array<string>()
            })
        })
    })
}).modify(w => ({
    documentType: w.computed((_, t) => t).tracked()
})).compile();

// const modelWithDate = s.define("MY_DATE_TABLE", {
//     _id: s.string().key().identity(),
//     _rev: s.string().identity(),
//     date: s.date().default(new Date()).deserialize(w => new Date(w)).serialize(w => w.toISOString()),
//     name: s.string()
// }).modify(w => ({
//     documentType: w.computed((_, t) => t).tracked()
// })).compile();

const plugin = new PouchDbPlugin("testing-db");
class Ctx extends DataContext {

    constructor() {
        super(plugin);
    }

    // test = this.dbset(model).create();
    nested = this.dbset(nested).stateful().create();
    immutable = this.dbset(nested).immutable().create();
    // date = this.dbset(modelWithDate).create();
}

// HOW CAN WE PUSH UPDATES TO THE DBSET FROM THE PLUGIN?
const r = async () => {
    try {
        // need to make sure we are handling enriching and merging correctly,
        // they are not taking into account defaults
        const ctx = new Ctx();
        debugger;

        // await ctx.date.addAsync({
        //     name: "James"
        // });

        // await ctx.saveChangesAsync();
        
        // await ctx.nested.addAsync({
        //     child: {
        //         name: "Child Name",
        //         nested: {
        //             more: {
        //                 array: ["test"],
        //                 final: 1
        //             },
        //             winner: 100
        //         }
        //     },
        //     name: "James"
        // });

        // await ctx.saveChangesAsync();
        // const s1 = performance.now();
            // const r = await ctx.nested.where(w => w.name == "James").firstOrUndefinedAsync();
        // console.log('DONE 5', performance.now() - s1, r);

        // const s2 = performance.now();
        // const r2 = await ctx.nested.where(w => w.name == "James").firstOrUndefinedAsync();
        // console.log('DONE 6', performance.now() - s2, r2)

        // const s1 = performance.now();
        // ctx.nested.where(w => w.name == "James").firstOrUndefined((r, e) => {
        //     console.log('DONE 1', performance.now() - s1, r, e)
        // });

        // const s2 = performance.now();
        // ctx.nested.where(w => w.name == "James").firstOrUndefined((r, e) => {
        //     console.log('DONE 2', performance.now() - s2, r, e)
        // });

        // const s3 = performance.now();
        // ctx.nested.where(w => w.name == "James").toArray((r, e) => {
        //     console.log('DONE 3', performance.now() - s3, r, e)
        // });

        await ctx.immutable.addAsync({
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
            name: "James"
        });

        // await ctx.saveChangesAsync();
        // const found = await ctx.immutable.firstOrUndefinedAsync(w => w.name === "James");

        // if (found != null) {
        //     const mutated = ctx.immutable.mutate(found, entity => {
        //         entity.name = "test";
        //     })

        //     console.log("Changed", mutated, found);
        // }


        debugger;

        // // we need to stop returning a new Data Access manager, can we put this in the plugin instead?
        // const unsubscribe = ctx.nested.where(w => w.name == "James").subscribe().toArray((r, e) => {
        //     console.log('DONE', r, e)
        // });

        // for (let i = 0; i < 50; i++) {
        //     await ctx.nested.addAsync({
        //         order: i,
        //         name: `James`,
        //         child: {
        //             name: `other ${i}`
        //         }
        //     });
        // }

        // console.log(nestedAdd);

        // const [added] =  await ctx.test.addAsync({
        //     name: "James8",
        //     year: 2024
        // });
        //unsubscribe();
        // await ctx.saveChangesAsync();
        // // let's not run prepare when getting changes. 
        // // after we call 'getChanges', we should call prepare on the adds and return a new object, then
        // // we can merge on the result and merge the resulting object.  We can forget about the object we send 
        // // over to save
        // debugger;

        // looks like PDB always returns 1 document when limit is 1... wtf?
        
        
        // const x9 = await ctx.nested.toArrayAsync();
        
        
        // const x = await ctx.nested.firstOrUndefinedAsync(w => w.child.name == "test");
        // debugger;
        // const x1 = await ctx.nested.where(w => w.child.name.startsWith("other")).toArrayAsync();
        // debugger;
        // // Weird stuff is happening here
        // // we are trying to auto create indexes
        // const x3 = await ctx.nested.order(w => w.order).toArrayAsync();
        // const x2 = await ctx.nested.order(w => w.name).toArrayAsync();
        // debugger;
        // const xx = await ctx.nested.firstOrUndefinedAsync(w => w._id === "");// we are working on it.  Mango query is too loose
        // const xx1 = await ctx.nested.firstOrUndefinedAsync(w => w.name === "");// we are working on it.  Mango query is too loose
        // debugger;
        // const xxx = await ctx.nested.firstOrUndefinedAsync(w => w._id === x9[0]._id);
        // debugger;
        //         // we need to have a dbset return a new queryable object and not reuse
        // const s = await ctx.nested.someAsync(([w, p]) => w.name === p.name, { name: "James6" });
        // debugger;
        // const foundOne = await ctx.nested.firstOrUndefinedAsync(w => w._id == "test");
        // debugger;




        // const found = await ctx.nested.where(([w, p]) => w.name.startsWith(p.name), { name: "James" })
        //     .order(w => w._id)
        //     .map(w => ({ name: w.name, _id: w._id }))
        //     .toArrayAsync();
        // debugger;
        // console.log(found)




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

        // let count = 0;
        // const id = setInterval(() => {
        //     count++;
        //     console.log(count);
        //     if (count >= 5 && id != null) {
        //         clearInterval(id);
        //     } 

        // }, 500)
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

const ctx = new Ctx();

const profileExecution = async (iterations: number) => {
    const data = [{ name: "James", year: 2024 }];
    let totalTime = 0;

    let low = 100;
    let high = 0;

    for (let i = 0; i < iterations; i++) {
        const start = performance.now(); // Start time
        await new Promise((resolve, reject) => {
            ctx.test.add(data, (r, e) => {
                if (e != null) {
                    reject(e);
                    return;
                }

                resolve(r);
            });
        });
        const end = performance.now(); // End time
        const total = end - start;

        if (total > high) {
            high = total;
        }

        if (total < low) {
            low = total;
        }

        totalTime += total;
    }

    const averageTime = totalTime / iterations;
    console.log(`Average execution time: ${averageTime.toFixed(4)}ms, Total execution time: ${totalTime.toFixed(4)}ms, H: ${high.toFixed(4)}, L: ${low.toFixed(4)}`);

    await new Promise((resolve, reject) => {
        const saveStart = performance.now();
        ctx.saveChanges((r, e) => {
            if (e != null) {
                reject(e);
                return;
            }
            console.log(`Save execution time: ${(performance.now() - saveStart).toFixed(4)}ms`);
            resolve(r);
        });
    });

};

// Run the profiler with the desired number of iterations
// profileExecution(1000);