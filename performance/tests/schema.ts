import { PouchDbPlugin, PouchDbRecord } from "@agrejus/db-framework-plugin-pouchdb";
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
    }),
    now: s.date()
});

type Book = InferType<typeof BooksSchema>;

class MyContext extends DataContext<DocumentTypes, PouchDbRecord<DocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    books = this.dbset().default<Book>(DocumentTypes.Books, BooksSchema).create();
}

/*
Schema Uses

    parsing
    identify the Id
    identify the type of each property and its metadata
    recursive entity tracking

*/

const getId = (schema: SchemaDefinition<DocumentTypes, any>) => {
    for(const key of Object.keys(schema.instance)) {
        if (schema.instance[key].isId === true) {
            return key;
        }
    }

    throw new Error('Id not found')
}

enum ParseTypes {
    parse = "parse",
    parseOptional = "parseOptional",
    parseNull = "parseNull",
    parseNullAndOptional = "parseNullAndOptional"
}

const parsers = {
    [SchemaTypes.String]: {
        [ParseTypes.parse]: (value: string) => value,
        [ParseTypes.parseOptional]: (value: string | undefined) => value,
        [ParseTypes.parseNull]: (value: string | null) => value,
        [ParseTypes.parseNullAndOptional]: (value: string | null | undefined) => value
    }
}

const getParseType = (property: SchemaBase<any>) => {

    if (property.isOptional === false && property.isNullable === false) {
        return ParseTypes.parse;
    }

    if (property.isOptional === true && property.isNullable === true) {
        return ParseTypes.parseNullAndOptional;
    }

    if (property.isOptional === true) {
        return ParseTypes.parseOptional;
    }

    return ParseTypes.parseNull;

}
const createParser = (schema: SchemaDefinition<DocumentTypes, any>) => {
    for(const key of Object.keys(schema.instance)) {

        const property: SchemaBase<any> = schema.instance[key];
        const parserType = getParseType(property);
        debugger;
        const parser = parsers[property.type][parserType];
        debugger;
    }

    throw new Error('Id not found')
}

const idPropertyName = getId(BooksSchema); 
const parser = createParser(BooksSchema);


const context = new MyContext();

// await context.books.add({
//     name: "test",
//     age: 1,
//     range: 1,
//     now: new Date(),
//     address: {
//         street: "test",
//         city: "test",
//         state: "test",
//         zip: "test",
//         country: {
//             name: "test",
//             enumerator: TestEnum.test,
//             other: ["test"],
//             isNow: true
//         }
//     }
// });