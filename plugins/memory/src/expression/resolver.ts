import { ComparatorExpression, Expression, OperatorExpression, PropertyPathExpression, QueryOptions, SchemaTypes, ValueExpression, QueryField, QuerySort } from "@agrejus/db-framework-core";

/**
 * Converts an Expression into a JavaScript filter function for filtering arrays
 * @param expression The expression to convert
 * @returns A function that takes an item and returns true if it matches the expression
 */
export const toJsFilter = (expression?: Expression): (item: any) => boolean => {
    if (!expression) {
        return () => true; // No expression = match everything
    }

    if (expression.type === "operator") {
        const operatorExp = expression as OperatorExpression;
        const leftFilter = toJsFilter(operatorExp.left!);
        const rightFilter = toJsFilter(operatorExp.right!);

        if (operatorExp.operator === "&&") {
            return (item) => leftFilter(item) && rightFilter(item);
        }

        if (operatorExp.operator === "||") {
            return (item) => leftFilter(item) || rightFilter(item);
        }

        throw new Error(`Unsupported operator: ${operatorExp.operator}`);
    }

    if (expression.type === "comparator") {
        const comparatorExp = expression as ComparatorExpression;
        const propertyInfo = (comparatorExp.left as PropertyPathExpression).property;
        const value = (comparatorExp.right as ValueExpression).value;
        const propertyPath = propertyInfo.getAssignmentPath();

        // Create a function to extract the property value from an item
        const getPropertyValue = (item: any) => {
            const path = propertyPath.split('.');
            let current = item;

            for (const part of path) {
                if (current === null || current === undefined) {
                    return undefined;
                }
                current = current[part];
            }

            return current;
        };

        switch (comparatorExp.comparator) {
            case "equals": {
                return (item) => {
                    const propValue = getPropertyValue(item);
                    return comparatorExp.negated
                        ? propValue !== value
                        : propValue === value;
                };
            }
            case "starts-with": {
                return (item) => {
                    const propValue = getPropertyValue(item);
                    if (typeof propValue !== 'string') return false;

                    const result = propValue.startsWith(value);
                    return comparatorExp.negated ? !result : result;
                };
            }
            case "ends-with": {
                return (item) => {
                    const propValue = getPropertyValue(item);
                    if (typeof propValue !== 'string') return false;

                    const result = propValue.endsWith(value);
                    return comparatorExp.negated ? !result : result;
                };
            }
            case "includes": {
                return (item) => {
                    const propValue = getPropertyValue(item);
                    if (typeof propValue !== 'string') return false;

                    const result = propValue.includes(value);
                    return comparatorExp.negated ? !result : result;
                };
            }
            default:
                throw new Error(`Unsupported comparator: ${comparatorExp.comparator}`);
        }
    }

    throw new Error(`Unsupported expression type: ${expression.type}`);
};

/**
 * Helper function to filter an array using an Expression
 * @param items Array to filter
 * @param expression Expression to filter by
 * @returns Filtered array
 */
export const filterArrayWithExpression = <T>(items: T[], expression: Expression): T[] => {
    const filterFn = toJsFilter(expression);
    return items.filter(filterFn);
};

/**
 * Applies query options to an array of items
 * @param items The array to apply options to
 * @param options The query options to apply
 * @returns The processed array with all query options applied
 */
export const applyQueryOptions = <T>(items: T[], options: QueryOptions): any[] => {
    let result = [...items]; // Clone array to avoid modifying original
    let isAggregation = false;

    // Apply filtering with expressions handled separately via filterArrayWithExpression

    // Apply sorting
    if (options.sort && options.sort.length > 0) {
        result.sort((a, b) => {
            for (const sortOption of options.sort!) {
                const { key, direction } = sortOption;
                const aValue = getNestedValue(a, key);
                const bValue = getNestedValue(b, key);

                // Handle undefined values
                if (aValue === undefined && bValue === undefined) continue;
                if (aValue === undefined) return direction === 'asc' ? 1 : -1;
                if (bValue === undefined) return direction === 'asc' ? -1 : 1;

                // Compare values
                if (aValue < bValue) return direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    // Apply aggregation functions
    if (options.min) {
        isAggregation = true;
        if (options.fields && options.fields.length > 0) {
            const field = options.fields[0].sourceName;
            const minValue = result.reduce((min: any, item) => {
                const value = getNestedValue(item, field);
                return (min === undefined || value < min) ? value : min;
            }, undefined);
            result = [minValue] as any[];
        }
    }
    else if (options.max) {
        isAggregation = true;
        if (options.fields && options.fields.length > 0) {
            const field = options.fields[0].sourceName;
            const maxValue = result.reduce((max: any, item) => {
                const value = getNestedValue(item, field);
                return (max === undefined || value > max) ? value : max;
            }, undefined);
            result = [maxValue] as any[];
        }
    }
    else if (options.sum) {
        isAggregation = true;
        if (options.fields && options.fields.length > 0) {
            const field = options.fields[0].sourceName;
            const sumValue = result.reduce((sum: number, item) => {
                const value = getNestedValue(item, field);
                return sum + (typeof value === 'number' ? value : 0);
            }, 0);
            result = [sumValue] as any[];
        }
    }
    else if (options.count) {
        isAggregation = true;
        result = [result.length] as any[];
    }
    else if (options.distinct) {
        isAggregation = true;
        if (options.fields && options.fields.length > 0) {
            const field = options.fields[0].sourceName;
            const values = new Set();
            result.forEach(item => {
                values.add(getNestedValue(item, field));
            });
            result = Array.from(values) as any[];
        }
    }

    // Apply field selection if not an aggregation result
    if (!isAggregation && options.fields && options.fields.length > 0) {
        result = result.map(item => {
            const newItem: any = {};
            for (const field of options.fields!) {
                const value = getNestedValue(item, field.sourceName);
                setNestedValue(newItem, field.destinationName, value);
            }
            return newItem;
        }) as any[];
    }

    // Apply pagination (skip/take) - applied last so it works with aggregated results too
    if (options.skip != null) {
        result = result.slice(options.skip);
    }

    if (options.take != null) {
        result = result.slice(0, options.take);
    }

    return result;
};

/**
 * Helper function to get a nested property value using a dot-notation path
 */
function getNestedValue(obj: any, path: string): any {
    if (!obj) return undefined;
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
        if (current === null || current === undefined) {
            return undefined;
        }
        current = current[part];
    }

    return current;
}

/**
 * Helper function to set a nested property value using a dot-notation path
 */
function setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in current)) {
            current[part] = {};
        }
        current = current[part];
    }

    current[parts[parts.length - 1]] = value;
}

/**
 * Complete function to query an array with both filtering and query options
 * @param items The array to query
 * @param expression Optional expression for filtering
 * @param options Query options for sorting, pagination, etc.
 * @returns The filtered and processed array
 */
export const queryArray = <T>(items: T[], expression?: Expression, options: QueryOptions = {}): any[] => {
    // First filter the array
    const filtered = expression ? filterArrayWithExpression(items, expression) : items;

    // Then apply query options
    return applyQueryOptions(filtered, options);
}; 