import { ComparatorExpression, Expression, OperatorExpression, PropertyPathExpression, ValueExpression } from "@agrejus/db-framework-core";
import PouchDB from 'pouchdb';

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
        const property = (comparatorExp.left as PropertyPathExpression).property;
        const value = (comparatorExp.right as ValueExpression).value;

        switch (comparatorExp.comparator) {
            case "equals":
                return {
                    [property]: comparatorExp.negated ? { $ne: value } : { $eq: value }
                };
            case "starts-with":
                if (comparatorExp.negated) {
                    throw new Error(`Mango queries do not support negated 'starts-with' directly.`);
                }
                return {
                    [property]: { $regex: `^${value}` }
                };
            case "ends-with":
                if (comparatorExp.negated) {
                    throw new Error(`Mango queries do not support negated 'ends-with' directly.`);
                }
                return {
                    [property]: { $regex: `${value}$` }
                };
            case "includes":
                if (comparatorExp.negated) {
                    throw new Error(`Mango queries do not support negated 'includes' directly.`);
                }
                return {
                    [property]: { $regex: value }
                };
            default:
                throw new Error(`Unsupported comparator: ${comparatorExp.comparator}`);
        }
    }
    
    throw new Error(`Unsupported expression type: ${expression.type}`);
};