import { MyDataContext } from './create-context';

const context = new MyDataContext();

await context.cars.add({
    make: "Tesla",
    model: "Model S",
    year: 2023,
    color: "white",
    trim: "P100D"
});

const preview = await context.previewChanges();

