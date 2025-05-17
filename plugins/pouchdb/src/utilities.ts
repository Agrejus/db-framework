import PouchDB from 'pouchdb';

export function assertIsResponse<T extends {}>(value: unknown): asserts value is PouchDB.Find.FindResponse<T> {
    if (isResponse<T>(value) === true) {
        return;
    }

    throw new Error("value is not typeof FindResponse")
}
export function isResponse<T extends {}>(value: unknown): value is PouchDB.Find.FindResponse<T> {
    return value != null && typeof value === "object" && "docs" in value && Array.isArray(value.docs);
}
