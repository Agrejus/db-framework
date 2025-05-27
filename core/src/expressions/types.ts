import { PropertyInfo } from "../common/PropertyInfo";
import { GenericFunction } from "../types";

export interface ComparatorExpression extends Expression {
    type: "comparator";
    comparator: Comparator;
    negated: boolean;
    strict: boolean;
}



export interface OperatorExpression extends Expression {
    type: "operator";
    operator: Operator;
}

export interface Expression {
    type: ExpressionType;
    left?: Expression;
    right?: Expression;
}

export interface PropertyPathExpression extends Expression {
    type: "property";
    property: PropertyInfo<any>;
}

export interface ValueExpression extends Expression {
    type: "value";
    value: unknown;
}

export type ExpressionType = "operator" | "comparator" | "property" | "value";
export type Comparator = "equals" | "starts-with" | "includes" | "ends-with" | "greater-than" | "greater-than-equals" | "less-than" | "less-than-equals";
export type Operator = "&&" | "||";

export type Filter<T extends any> = GenericFunction<T, boolean>;
export type ParamsFilter<T extends any, P> = (payload: [T, P]) => boolean;
export type CompositeFilter<T extends any, P = never> = Filter<T> | ParamsFilter<T, P>;
export type Filterable<T extends any, P = any> = {
    filter: CompositeFilter<T, P>;
    params?: P;
}