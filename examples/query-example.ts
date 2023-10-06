import { MyDataContext } from './context'


const context = new MyDataContext();
// Find all cars made in 2021
const chevy2021Vehicles = await context.vehicles.filter(w => w.year === 2021 && w.make === "Chevrolet");


