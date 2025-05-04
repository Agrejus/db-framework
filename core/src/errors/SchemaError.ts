export class SchemaError extends Error {

    constructor(error: any, innerErrorMessage: string) {
        super(`Error: ${error.message}; Inner Error: ${innerErrorMessage}`);
    }
}