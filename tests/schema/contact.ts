import { s, InferType } from '../../src/index';
import { DocumentTypes } from '..';

export const ContactSchema = s.define(DocumentTypes.Contacts, {
    _id: s.string({ isId: true }),
    _rev: s.string(),
    firstName: s.string(),
    lastName: s.string(),
    address: s.string(),
    phone: s.string(),
});

export type Contact = InferType<typeof ContactSchema>;