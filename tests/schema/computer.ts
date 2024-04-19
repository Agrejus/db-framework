import { s } from '../../src/index';
import { DocumentTypes, PluginType } from '..';

const baseSchema = {
    name: s.string(),
    cores: s.number(),
    keyboard: s.string().optional()
}

export const createSchema = (type: PluginType) => {

    if (type === "PouchDB") {
        return s.define(DocumentTypes.Computers, {
            _id: s.string({ isId: true }),
            _rev: s.string(),
            ...baseSchema
        })
    }

    if (type === "LocalStorage") {
        return s.define(DocumentTypes.Computers, {
            id: s.string({ isId: true }),
            timestamp: s.number(),
            ...baseSchema
        })
    }

    return s.define(DocumentTypes.Computers, {
        id: s.string({ isId: true }),
        rev: s.string(),
        ...baseSchema
    })
}
