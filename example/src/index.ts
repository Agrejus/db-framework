import { DataContext } from "@agrejus/db-framework";
import { s, createUUID } from "@agrejus/db-framework-core";
import { PouchDbPlugin } from "@agrejus/db-framework-plugin-pouchdb";
import { performance } from 'perf_hooks'

const model = s.define("MY_TABLE", {
    _id: s.string().key().default((i) => i.createUUID(64), { createUUID }),
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

const plugin = new PouchDbPlugin("testing-db");
class Ctx extends DataContext {

    constructor() {
        super(plugin);
    }

    test = this.dbset(model);
    nested = this.dbset(nested);
}


const r = async () => {
    try {
        const ctx = new Ctx();

        // const [nestedAdd] =  await ctx.nested.addAsync({
        //     name: "James6",
        //     child: {
        //         name: "test"
        //     }
        // });

        // console.log(nestedAdd);

        const [added] =  await ctx.test.addAsync({
            name: "James8",
            year: 2024
        });
        await ctx.saveChangesAsync();
        // // let's not run prepare when getting changes. 
        // // after we call 'getChanges', we should call prepare on the adds and return a new object, then
        // // we can merge on the result and merge the resulting object.  We can forget about the object we send 
        // // over to save
        debugger;
        // we need to recognize this
        const found = await ctx.test.where(([w, p]) => w.name === p.name, { name: "James8" }).toArrayAsync();

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