import { IDbRecord } from "../../../../src/types/entity-types";

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

export interface IPouchDbRecord<TDocumentType extends string> extends IDbRecord<TDocumentType> {
    readonly _id: string;
    readonly _rev: string;
}

export interface IContact extends IPouchDbRecord<DocumentTypes> {
    firstName: string;
    lastName: string;
    address: string;
    phone: string;
}

export interface IComputer extends IPouchDbRecord<DocumentTypes> {
    name: string;
    cores: number;
    keyboard?: string;
}

export interface INote extends IPouchDbRecord<DocumentTypes> {
    contents: string;
    createdDate: Date;
    userId: string;
}

export interface INoteV2 extends IPouchDbRecord<DocumentTypes> {
    contents: string;
    createdDate: string;
    userId: string;
}


export interface IBook extends IPouchDbRecord<DocumentTypes> {
    author: string;
    publishDate?: Date;
    rejectedCount: number;
    status: "pending" | "approved" | "rejected";
}

export interface IBookV4 extends IPouchDbRecord<DocumentTypes> {
    author: string;
    publishDate?: Date;
    createdDate: Date;
    rejectedCount: number;
    status: "pending" | "approved" | "rejected";
}

export interface ICar extends IPouchDbRecord<DocumentTypes> {
    make: string;
    model: string;
    year: number;
    manufactureDate: Date;
}

export interface IPreference extends IPouchDbRecord<DocumentTypes> {
    isSomePropertyOn: boolean;
    isOtherPropertyOn: boolean;
}

export interface ISyncDocument<TDocumentType extends string> extends IPouchDbRecord<TDocumentType> {
    SyncStatus: "Pending" | "Failed" | "Succeeded";
    SyncRetryCount: number
}

export interface ISetStatus {
    failed: number;
    pending: number;
    succeeded: number;
}

export interface IBookV3 extends ISyncDocument<DocumentTypes> {
    author: string;
    publishDate?: Date;
    rejectedCount: number;
}

export interface ISplitComputer extends IPouchDbRecord<DocumentTypes> {
    name: string;
    cores: number;
    keyboard?: string;
    reference: INoteV2
}

export interface ISplitBook extends IPouchDbRecord<DocumentTypes> {
    author: string;
    publishDate?: string;
    rejectedCount: number;
    status: "pending" | "approved" | "rejected";
    reference: INoteV2
}