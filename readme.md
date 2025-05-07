Can we put TTL on some of the records?  We can check every N times for TTLs and purge them

class Ctx extends DataContext {

    constructor() {
        super(plugin);
    }

    nested = this.dbset(nested).immutable().create();
}

const { mutate } = context.nested;

// Cannot do immutable, we have no way to assign identity properties after save
const item = await context.nested.first(w => w.id === 1);

const newItem = mutate(mutate, {
    test: 1
 })


Are these needed?
    onBeforeSave
    onAfterSave

DataContext
    all() - not needed, documents are too dissimilar

DbSet
    subscribe to changes (Live Query)
    Can we do caching? Stringify the function and use as cache key
    How can we store data in memory and get data from there instead of the db
        We could have wicked fast queries with caching
        Can we set a cache total and store in memory?  Only cache 10k records?
            Or we can do the top queries and cache those?

Provide Custom DbSet to restore legacy functionality
    pluck
        where(w => w).map(w => ({ test:w.test })).firstOrUndefined();

    filter
        where(w => w).toArray()

Can we do CDC so we can create history tables?
    Can we apply a TTL to documents?

Can we provide optimistic updates to provide faster subscription calls?


Lets use Pipe and Filter to perform actions on our data

// Define the context type (can be extended as needed)
interface Context {
  [key: string]: any;
}

// Define the rule/processor type
type Processor = (context: Context) => Context;

// Pipeline class to manage the sequence of operations
class Pipeline {
  private processors: Processor[] = [];

  // Add a processor to the pipeline
  addProcessor(processor: Processor): Pipeline {
    this.processors.push(processor);
    return this; // For chaining
  }

  // Process the context through all processors
  run(initialContext: Context): Context {
    return this.processors.reduce(
      (context, processor) => processor(context),
      initialContext
    );
  }
}

// Example usage
const pipeline = new Pipeline();

// Add processors/rules
pipeline
  .addProcessor((ctx) => {
    // Rule 1: Add user info
    return { ...ctx, user: { name: "John", role: "admin" } };
  })
  .addProcessor((ctx) => {
    // Rule 2: Add timestamp
    return { ...ctx, timestamp: Date.now() };
  })
  .addProcessor((ctx) => {
    // Rule 3: Calculate permissions based on role
    const permissions = ctx.user.role === "admin" 
      ? ["read", "write", "delete"] 
      : ["read"];
    return { ...ctx, permissions };
  });

// Run the pipeline with initial context
const initialContext: Context = { requestId: "123" };
const result = pipeline.run(initialContext);
console.log(result);


# TODO
- Stateful queries should always return an array of data, how can we make that work?