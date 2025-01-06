import { PropertyInfo } from "../common/PropertyInfo";

export interface ComparatorExpression extends Expression {
    type: "comparator";
    comparator: Comparator;
    negated: boolean;
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
    value: string;
}

export type ExpressionType = "operator" | "comparator" | "property" | "value";
export type Comparator = "equals" | "starts-with" | "includes" | "ends-with";
export type Operator = "&&" | "||";