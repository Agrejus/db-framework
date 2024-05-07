import { PouchDbPlugin, PouchDbRecord, IPouchDbPluginOptions } from "@agrejus/db-framework-plugin-pouchdb";
import { DocumentTypes } from "../../src/__tests__/integration/shared/types";
import { s, InferType, SchemaTypes } from "../../src/schema";
import { DataContext } from "../../src/context/DataContext";
import { SchemaDefinition } from "../../src/schema/types/Definition";
import { SchemaBase } from "../../src/schema/types/Base";

enum TestEnum {
    test = "test",
    test2 = "test2",

}

const BooksSchema = s.define(DocumentTypes.Books, {
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

type Book = InferType<typeof BooksSchema>;

class MyContext extends DataContext<DocumentTypes, PouchDbRecord<DocumentTypes>, "_id" | "_rev", IPouchDbPluginOptions, PouchDbPlugin<DocumentTypes, PouchDbRecord<DocumentTypes>, IPouchDbPluginOptions>> {

    contextId() {
        return MyContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    books = this.dbset().default<Book>(DocumentTypes.Books, BooksSchema).create();
}

const getId = (schema: SchemaDefinition<DocumentTypes, any>) => {
    for (const key of Object.keys(schema.instance)) {
        if (schema.instance[key].isId === true) {
            return key;
        }
    }

    throw new Error('Id not found')
}

enum ParseTypes {
    parse = "parse",
    parseNullableOrOptional = "parseNullableOrOptional"
}


// const getParseType = (property: SchemaBase<any>, isNullableOrOptional: boolean) => {

//     if (property.isOptional === false && property.isNullable === false) {
//         return ParseTypes.parse;
//     }

//     if (property.isOptional === true && property.isNullable === true) {
//         return ParseTypes.parseNullAndOptional;
//     }

//     if (property.isOptional === true) {
//         return ParseTypes.parseOptional;
//     }

//     return ParseTypes.parseNull;

// }

// when enabling tracking, every item must have a parent so we can easily set changes on the parent and not on the child
// OR
// schema has all paths we need to check for changes
//     example entity.hasChanged || entity.address.hasChanged, this can be an easy check
// Schema should know how to sanitize (remove added properties and check for changes)


const joinPaths = (path: string, key: string, isNullableOrOptional: boolean) => {
    const join = isNullableOrOptional ? "?." : ".";

    if (path == "") {
        return key;
    }

    return path + join + key;
}


const iterate = (schema: SchemaDefinition<DocumentTypes, any>) => {
    const properties: { path: string, propertyName: string, type: SchemaTypes, isNullableOrOptional: boolean }[] = [];
    const explore: { schema: SchemaBase<any>, path: string, isNullableOrOptional: boolean }[] = [{ schema, path: "", isNullableOrOptional: false }];
    let idPropertyName: string = "";

    for (let i = 0; i < explore.length; i++) {
        const item = explore[i];

        for (const key in item.schema.instance) {
            const property = item.schema.instance[key] as SchemaBase<any>;
            const path = joinPaths(item.path, key, item.isNullableOrOptional);
            const isNullableOrOptional = item.isNullableOrOptional || property.isOptional || property.isNullable;
            const type = property.type;
            const propertyName = key;

            if (property.isId === true) {
                idPropertyName = key;
            }

            if (property.type === SchemaTypes.Object) {
                explore.push({ schema: property, path, isNullableOrOptional });
                properties.push({ path, type, isNullableOrOptional, propertyName });
                continue;
            }

            properties.push({ path, type, isNullableOrOptional, propertyName });
        }
    }

    // generate a hasChanged function
    // this would be this.__isDirty || this.address?.__isDirty || this.address?.country?.__isDirty
    return {
        properties,
        idPropertyName
    }
}

// when tracking multiple objects with Proxies, each proxy must have a reference to the parent
const p = iterate(BooksSchema);

console.log(p);

/*
Schema Uses

    identify the Id
    recursive entity tracking
    identify the type of each property and its metadata
    enriching should be faster? we now know what properties the entity was enhanced with
        use this to create a spread operator to get us back to the original object when saving
    parsing

    result {
        idPropertyName,
        schema: {
            id: string,
            name: string
        }
    }

*/

const idPropertyName = getId(BooksSchema);


const context = new MyContext();

const fn = async () => {
    const added = await context.books.add({
        name: "test",
        age: 1,
        range: 1,
        now: new Date(),
        address: {
            street: "test",
            city: "test",
            state: "test",
            zip: "test",
            country: {
                name: "test",
                enumerator: TestEnum.test,
                other: ["test"],
                isNow: true
            }
        }
    });

    console.log(added);
    // after saving the proxy is still there tracking changes, we need to strip it out

    await context.saveChanges();


    const found = await context.books.find(w => w.name === "test");

    if (found != null) {
        found.age = 10;
        found.address!.city = "changed";

        const added = await context.books.add({
            name: "test1",
            age: 1,
            range: 1,
            now: new Date(),
            address: {
                street: "test1",
                city: "test1",
                state: "test1",
                zip: "test1",
                country: {
                    name: "test1",
                    enumerator: TestEnum.test,
                    other: ["test1"],
                    isNow: true
                }
            }
        });
        debugger;
        await context.saveChanges();
    }
    debugger;
}

fn();