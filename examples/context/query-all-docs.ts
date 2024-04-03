import { MyDataContext } from './create-context';


const context = new MyDataContext();

// Get all documents
const allDocs = await context.all();

