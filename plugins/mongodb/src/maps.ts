import { SchemaTypes } from '@agrejus/db-framework';

export const typeMap = {
    [SchemaTypes.Array]: Array,
    [SchemaTypes.Boolean]: Boolean,
    [SchemaTypes.Date]: Date,
    [SchemaTypes.Object]: Object,
    [SchemaTypes.Number]: Number,
    [SchemaTypes.String]: String,
    [SchemaTypes.Definition]: false,
}