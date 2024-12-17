import { DataContext } from "@agrejus/db-framework";
import { s } from "@agrejus/db-framework-core";
import { createUUID } from "@agrejus/db-framework-core/dist/utilities";
import { PouchDbPlugin } from "@agrejus/db-framework-plugin-pouchdb";
import { performance } from 'perf_hooks'

const model = s.define("MY_TABLE", {
    _id: s.string().key().identity(),
    _rev: s.string().identity(),
    name: s.string(),
    year: s.number(),
    date: s.date().default(new Date()).deserialize(w => new Date(w)).serialize(w => w.toISOString())
}).append(w => ({
    test: w.computed(w => w._id),
    toString: w.function(w => w.date.toISOString())
})).compile();

const plugin = new PouchDbPlugin("testing-db");
class Ctx extends DataContext {

    constructor() {
        super(plugin);
    }

    test = this.dbset(model)
}


// const r = async () => {
//     try {
//         const ctx = new Ctx();

//         const [added] =  await ctx.test.addAsync({
//             name: "James",
//             year: 2024
//         });
    
//         // let's not run prepare when getting changes. 
//         // after we call 'getChanges', we should call prepare on the adds and return a new object, then
//         // we can merge on the result and merge the resulting object.  We can forget about the object we send 
//         // over to save
    
//         console.log(added);
//         debugger;
//          await ctx.saveChangesAsync();
//         debugger;
//         console.log(added);
    
//         console.log(added.toString())
//     } catch (e) {
//         debugger;
//         console.log(e)
//     }
// }

// r();
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
        totalTime += end - start;
    }

    const averageTime = totalTime / iterations;
    console.log(`Average execution time: ${averageTime.toFixed(4)}ms, Total execution time: ${totalTime.toFixed(4)}ms`);

    const saveStart = performance.now();
    await new Promise((resolve, reject) => {
        ctx.saveChanges((r, e) => {
            if (e != null) {
                reject(e);
                return;
            }
            console.log('SAVED', r)
            resolve(r);
        });
    });
    console.log(`Save execution time: ${(performance.now() - saveStart).toFixed(4)}ms`);
};

// Run the profiler with the desired number of iterations
profileExecution(1000);