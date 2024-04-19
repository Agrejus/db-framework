export enum DocumentTypes {
    Notes = "Notes",
    NotesWithMapping = "NotesWithMapping",
    Contacts = "Contacts",
    OverrideContacts = "OverrideContacts",
    OverrideContactsV2 = "OverrideContactsV2",
    OverrideContactsV3 = "OverrideContactsV3",
    Books = "Books",
    BooksWithOn = "BooksWithOn",
    BooksWithOnV2 = "BooksWithOnV2",
    BooksNoKey = "BooksNoKey",
    BooksV3 = "BooksV3",
    BooksV4 = "BooksV4",
    BooksWithDefaults = "BooksWithDefaults",
    BooksWithDefaultsV2 = "BooksWithDefaultsV2",
    BooksWithNoDefaults = "BooksWithNoDefaults",
    BooksWithTwoDefaults = "BooksWithTwoDefaults",
    Cars = "Cars",
    CarsWithDefault = "CarsWithDefault",
    Preference = "Preference",
    PreferenceV2 = "PreferenceV2",
    ReadonlyPreference = "ReadonlyPreference",
    BooksWithDateMapped = "BooksWithDateMapped",
    BooksWithIndex = "BooksWithIndex",

    Computers = "Computers",

    SplitComputers = "SplitComputers",
    SplitBooks = "SplitBooks",
}

export type PluginType = "PouchDB" | "Memory" | "LocalStorage";