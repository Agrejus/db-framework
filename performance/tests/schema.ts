import { s, InferType } from "../../src/schema";

enum TestEnum {
    test = "test",
    test2 = "test2",

}

const result = s.object({
    range: s.number<1 | 2>(),
    name: s.string().optional().nullable(),
    age: s.number().nullable().optional(),
    // test: g.array({
    //     name: g.string(),
    // }),
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
})

debugger;
type result = InferType<typeof result>;