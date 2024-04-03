import { MyDataContext } from '../create-context';

const context = new MyDataContext();

const found = await context.cars.find(w => w.year === 2021);

if (found != null) {
    found.trim = "some different trim"
}

await context.saveChanges();

