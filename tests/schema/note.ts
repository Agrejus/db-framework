import { s, InferType } from '../../src/index';
import { DocumentTypes } from '..';

export const NoteSchema = s.define(DocumentTypes.Notes, {
    _id: s.string({ isId: true }),
    _rev: s.string(),
    contents: s.string(),
    createdDate: s.date(),
    userId: s.string()
});

export type Note = InferType<typeof NoteSchema>;