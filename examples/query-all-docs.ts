import { MyDataContext } from './context'


const context = new MyDataContext();
// Find all cars made in 2021
const allDocs = await context.getAllDocs();

