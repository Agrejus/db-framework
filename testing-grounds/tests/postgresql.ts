import { IPostgreSqlPluginOptions, PostgreSqlPlugin, PostgreSqlRecord } from "@agrejus/db-framework-plugin-postgresql";
import { s, InferType, SchemaTypes, DataContext } from "@agrejus/db-framework";

export enum Tables {
    Sample = "api.sample"
}

enum TestEnum {
    test = "test",
    test2 = "test2",

}

const SampleSchema = s.define(Tables.Sample, {
    id: s.string({ isId: true }),
    timestamp: s.number({ isAutoGenerated: true }),
    reward_id: s.number(),
    coin_symbol: s.string(),
    created_at: s.number({ isAutoGenerated: true }),
    updated_at: s.number({ isAutoGenerated: true })
});

type Sample = InferType<typeof SampleSchema>;

class MyContext extends DataContext<Tables, PostgreSqlRecord<Tables>, "id" | "timestamp", IPostgreSqlPluginOptions, PostgreSqlPlugin<Tables, PostgreSqlRecord<Tables>, IPostgreSqlPluginOptions>> {

    contextId() {
        return MyContext.name;
    }

    constructor() {
        super({ dbName: "moso", connectionString: "postgres://admin:admin@localhost:5432/moso" }, PostgreSqlPlugin)
    }

    samples = this.dbset().default<Sample>(SampleSchema).exclude("created_at", "updated_at").create();
}

const context = new MyContext();

const fn = async () => {
    const found = await context.samples.find(w => w.reward_id == 12);

    debugger;
    const x = await context.samples.get('568e5e48-b704-47fc-9f48-99026b9ba2b0');
    debugger;
    console.log(x);
    await context.samples.add({
        coin_symbol: "test",
        reward_id: 900
    })
    const response = await context.saveChanges();

    console.log(response);

    debugger;

    if (found != null) {
        found.reward_id = 1;
        await context.saveChanges();
    } 

    debugger;
    const all = await context.samples.all();
    debugger;
    console.log(all)
}

fn();