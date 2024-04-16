# Schema Builder

New in DB Framework `1.2.0` is the schema builder.  Eventually interfaces and types will no longer be allowed and everything will move to a schema.  Schemas are only used to define the shape of an object, they are not used for validation.  Meaning, entities returned from the underlying data store are not validated to match the schema.  If there is a desire to ensure entities match, schema validation like [Zod](https://zod.dev/) should be used in the middleware of DB Framework to ensure entites match.

The goal of the schema builder is to provide better support for JavaScript, increase performance, and enable nested change tracking.  Without a defined schema, interfaces and types are lost when TypeScript is transpiled into JavaScript.  This means DB Framework does not know the shape of the entities it is working with, which leads to slower performance and the inability to perform certain actions.

The schema builder still produces a type from the schema that can be used.  To get the type, `InferType` must be used on the schema as seen below.

As seen below, the schema builder has support for union types, nullable, optional, arrays, ids, and nested objects.  It is 10000% inspired by [Zod](https://zod.dev/).

```typescript
export const SomeExampleSchema = s.define(DocumentTypes.SomeExample, {
    _id: s.string({ isId: true }),
    _rev: s.string(),
    range: s.number<1 | 2>(),
    name: s.string().optional().nullable(),
    age: s.number().nullable().optional(),
    address: s.object({
        street: s.string(),
        city: s.string(),
        state: s.string().optional(),
        zip: s.string(),
        country: s.object({
            name: s.string(),
            enumerator: s.string<TestEnum>(),
            other: s.array<string>().nullable(),
            isNow: s.boolean().nullable()
        })
    }).optional(),
    now: s.date()
});

export type SomeExample = InferType<typeof SomeExampleSchema>;
```

Using the schema with the corresponding dbset is very easy, simply pass the schema into the `default` function call when the dbset is created as shown below.  This will be simplified in later versions of DB Framework.

```typescript
class MyContext extends DataContext<DocumentTypes, PouchDbRecord<DocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    books = this.dbset().default<SomeExample>(DocumentTypes.SomeExample, SomeExampleSchema).create();
}
```


