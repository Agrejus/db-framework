import { s } from '../../src/index';
import { DocumentTypes, PluginType } from '..';

const documentType = DocumentTypes.Computers
const baseSchema = {
    name: s.string(),
    cores: s.number(),
    keyboard: s.string().optional()
}

const pdb = s.define(documentType, {
    _id: s.string({ isId: true }),
    _rev: s.string(),
    ...baseSchema
})

const dflt = s.define(documentType, {
    id: s.string({ isId: true }),
    rev: s.string(),
    ...baseSchema
})

export function createComputerSchema(type: "LocalStorage") : typeof dflt
export function createComputerSchema(type: "PouchDB") : typeof pdb
export function createComputerSchema(type: "Memory") : typeof dflt
export function createComputerSchema(type: PluginType) {
    if (type === "PouchDB") {
        return pdb;
    }

    if (type === "LocalStorage") {
        return dflt;
    }

    return dflt;
}