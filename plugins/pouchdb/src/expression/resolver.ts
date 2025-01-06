import { ComparatorExpression, Expression, OperatorExpression, PropertyPathExpression, QueryOptions, SchemaTypes, ValueExpression } from "@agrejus/db-framework-core";
import PouchDB from 'pouchdb';

export const setQueryOptions = (options: QueryOptions, query: PouchDB.Find.FindRequest<unknown>) => {

    // Handle skip/limit
    if (options.skip != null) {
        query.skip = options.skip;
    }
    if (options.take != null) {
        query.limit = options.take;
    } 
    else {
        query.limit = undefined; // select all
    }

    // Handle sorting
    if (options.sort && options.sort.length > 0) {
        query.sort = options.sort.map(order => ({
            [order.key]: order.direction
        }));
    }

    // Handle field selection and renaming
    if (options.fields && options.fields.length > 0) {
        query.fields = options.fields.map(field => field.sourceName);
    }

    // Handle aggregation functions
    // if (options.min) {
    //     query.reduce = true;
    //     query.group = true;
    //     query.group_level = 1;
    // }
    // if (options.max) {
    //     query.reduce = true;
    //     query.group = true;
    //     query.group_level = 1;
    // }
    // if (options.sum) {
    //     query.reduce = true;
    //     query.group = true;
    // }
    // if (options.count) {
    //     query.reduce = true;
    //     query.group = true;
    // }
    // if (options.distinct) {
    //     query.group = true;
    //     query.group_level = 1;
    // }
}
// we are going to need property types in the xpression, can we pass in PropertyInfo?
export const toMango = (expression: Expression): PouchDB.Find.Selector => {

    if (expression.type === "operator") {
        const operatorExp = expression as OperatorExpression;

        if (operatorExp.operator === "&&") {
            return {
                $and: [
                    toMango(operatorExp.left!),
                    toMango(operatorExp.right!)
                ]
            };
        }

        if (operatorExp.operator === "||") {
            return {
                $or: [
                    toMango(operatorExp.left!),
                    toMango(operatorExp.right!)
                ]
            };
        }

        throw new Error(`Unsupported operator: ${operatorExp.operator}`);
    }
    
    if (expression.type === "comparator") {
        const comparatorExp = expression as ComparatorExpression;
        const propertyInfo = (comparatorExp.left as PropertyPathExpression).property;
        const value = (comparatorExp.right as ValueExpression).value;
        const propertyPath = propertyInfo.getAssignmentPath();

        switch (comparatorExp.comparator) {
            case "equals": {
                // Only add type check for _id property because PDB is funky
                if (propertyPath === "_id") {
                    return {
                        $and: [
                            { [propertyPath]: { $type: getMangoType(propertyInfo.type) } },
                            { [propertyPath]: comparatorExp.negated ? { $ne: value } : { $eq: value } }
                        ]
                    };
                }
                return {
                    [propertyPath]: comparatorExp.negated ? { $ne: value } : { $eq: value }
                };
            }
            case "starts-with":
                if (comparatorExp.negated) {
                    throw new Error(`Mango queries do not support negated 'starts-with' directly.`);
                }
                return {
                    [propertyPath]: { $regex: `^${escapeRegex(value)}` }
                };
            case "ends-with":
                if (comparatorExp.negated) {
                    throw new Error(`Mango queries do not support negated 'ends-with' directly.`);
                }
                return {
                    [propertyPath]: { $regex: `${escapeRegex(value)}$` }
                };
            case "includes":
                if (comparatorExp.negated) {
                    throw new Error(`Mango queries do not support negated 'includes' directly.`);
                }
                return {
                    [propertyPath]: { $regex: escapeRegex(value) }
                };
            default:
                throw new Error(`Unsupported comparator: ${comparatorExp.comparator}`);
        }
    }

    throw new Error(`Unsupported expression type: ${expression.type}`);
};

function getMangoType(schemaType: SchemaTypes): "string" | "number" | "boolean" | "object" | "null" | "array" {
    switch (schemaType) {
        case SchemaTypes.String:
            return 'string';
        case SchemaTypes.Number:
            return 'number';
        case SchemaTypes.Boolean:
            return 'boolean';
        case SchemaTypes.Date:
            return 'string';  // dates are stored as strings
        case SchemaTypes.Object:
            return 'object';
        case SchemaTypes.Array:
            return 'array';
        default:
            return 'string';
    }
}

function escapeRegex(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}