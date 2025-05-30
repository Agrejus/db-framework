import { CompiledSchema, SchemaTarget } from '../schema';
import { now } from '../utilities/index';
import { DbPluginBulkOperationsEvent, DbPluginQueryEvent, EntityChanges, EntityModificationResult, IDbPlugin, IQuery } from './types';

// Check if we're in development environment
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;

// Hook types for extensibility
export type LogHook<T> = (data: T & Record<string, unknown>) => void;

export type QueryLogContext<TEntity extends {}, TShape extends any = TEntity> = {
    query: IQuery<TEntity, TShape> & Record<string, unknown>;
    schema: CompiledSchema<TEntity>;
    result?: TShape;
    error?: any;
    duration: number;
    isCriticalError?: boolean;
};

export type BulkOperationsLogContext<TEntity extends {}> = {
    schema: CompiledSchema<TEntity>;
    operations: EntityChanges<TEntity>;
    result?: EntityModificationResult<TEntity>;
    error?: any;
    duration: number;
    operationId: string;
    isCriticalError?: boolean;
} & Record<string, unknown>;

export type LoggingOptions<TEntity extends {}, TShape> = LoggingHookOptions<TEntity, TShape> & {
    logStyle?: 'minimal' | 'detailed';
};

export type LoggingHookOptions<TEntity extends {}, TShape> = {
    onQueryRequest?: LogHook<QueryLogContext<TEntity, TShape>>;
    onQueryResponse?: LogHook<QueryLogContext<TEntity, TShape>>;
    onBulkOperationsRequest?: LogHook<BulkOperationsLogContext<TEntity>>;
    onBulkOperationsResponse?: LogHook<BulkOperationsLogContext<TEntity>>;
}

export class DbPluginLogging implements IDbPlugin {
    plugin: IDbPlugin;
    private _logStyle: 'minimal' | 'detailed';
    private _hooks: Omit<LoggingOptions<any, any>, "logStyle">;
    private _shouldLog: boolean;

    private constructor(plugin: IDbPlugin, options?: LoggingOptions<any, any>) {
        this.plugin = plugin;
        this._logStyle = options?.logStyle ?? 'detailed';
        this._hooks = {
            onQueryRequest: options?.onQueryRequest,
            onQueryResponse: options?.onQueryResponse,
            onBulkOperationsRequest: options?.onBulkOperationsRequest,
            onBulkOperationsResponse: options?.onBulkOperationsResponse
        };
        // Only log in development mode by default
        this._shouldLog = isDevelopment;
    }

    /**
     * Creates a new DbPluginLogging that wraps a database plugin with logging functionality.
     * 
     * @param plugin The database plugin to wrap with logging
     * @param options Configuration options for the logger
     * @returns A new DbPluginLogging instance
     */
    static create(plugin: IDbPlugin, options?: LoggingOptions<any, any>) {
        return new DbPluginLogging(plugin, options);
    }

    /**
     * Adds or updates a hook for extending the logging functionality
     * @param hookName The name of the hook to set
     * @param hookFn The hook function to call
     */
    setHook<N extends keyof LoggingHookOptions<unknown, unknown>>(hookName: N, hookFn: LoggingHookOptions<unknown, unknown>[N]) {
        this._hooks[hookName] = hookFn;
        return this; // For chaining
    }

    query<TEntity extends {}, TShape extends any = TEntity>(event: DbPluginQueryEvent<TEntity, TShape>, done: (result: TShape, error?: any) => void): void {
        const { operation, schema } = event;
        const start = now();

        // Create context for hooks and logging
        const context: QueryLogContext<TEntity, TShape> = {
            query: operation,
            duration: 0,
            schema
        };

        // Call the request hook if defined
        if (this._hooks.onQueryRequest) {
            this._hooks.onQueryRequest(context);
        }

        try {
            // Wrap the callback to measure and log the execution time
            this.plugin.query(event, (result, error) => {
                const end = now();
                const duration = end - start;

                // Update context with result information
                context.result = result;
                context.error = error;
                context.duration = duration;
                context.isCriticalError = false;

                // Log the query result
                this._logQueryResult(context);

                // Call the response hook if defined
                if (this._hooks.onQueryResponse) {
                    this._hooks.onQueryResponse(context);
                }

                // Call the original callback
                done(result, error);
            });
        } catch (e: any) {
            const end = now();
            const duration = end - start;

            // Update context with error information
            context.error = e;
            context.duration = duration;
            context.isCriticalError = true;

            // Log the error
            this._logQueryResult(context);

            // Call the response hook if defined
            if (this._hooks.onQueryResponse) {
                this._hooks.onQueryResponse(context);
            }

            // Since we can't return null for TShape, we need to cast it
            done(null as unknown as TShape, e);
        }
    }

    private _logQueryResult<TEntity extends {}, TShape extends any = TEntity>(
        context: QueryLogContext<TEntity, TShape>
    ): void {
        // Skip logging if not in development environment
        if (!this._shouldLog) return;

        const { query, result, error, duration, isCriticalError, schema } = context;
        const pluginName = "constructor" in this.plugin ? ` [${this.plugin.constructor.name}]` : "";
        const schemaName = schema.collectionName;

        if (this._logStyle === 'minimal') {
            if (error) {
                const errorType = isCriticalError ? 'CRITICAL ERROR' : 'Error';
                console.error(`${isCriticalError ? '💀' : '❌'} Query ${errorType} [${schemaName}]:`, error);
            } else {
                console.log(`✅ Query [${schemaName}] completed in ${duration.toFixed(2)}ms`);
            }
            return;
        }

        // Determine speed category and set appropriate styling
        let speedEmoji = '⚡'; // Fast
        let headerColor = '#4CAF50'; // Green for fast
        let speedText = 'FAST';

        if (duration > 1000) {
            speedEmoji = '🐢'; // Slow
            headerColor = '#F44336'; // Red for slow
            speedText = 'SLOW';
        } else if (duration > 300) {
            speedEmoji = '⏱️'; // Medium
            headerColor = '#FF9800'; // Orange for medium
            speedText = 'MEDIUM';
        }

        // Create appropriate header based on success/error
        const headerStyle = error
            ? `color: ${isCriticalError ? '#D50000' : '#F44336'}; font-weight: bold;`
            : `color: ${headerColor}; font-weight: bold;`;

        // Add result count to the header
        let resultCount = '';
        if (!error && result != null) {
            if (Array.isArray(result)) {
                resultCount = ` (${result.length} items)`;
            } else if (typeof result === 'object' && result !== null) {
                resultCount = ' (1 item)';
            }
        }

        const headerTitle = error
            ? `${isCriticalError ? '💀' : '❌'}${pluginName} QUERY ERROR: ${schemaName}`
            : `${speedEmoji}${pluginName} QUERY: ${schemaName}${resultCount}`;

        console.groupCollapsed(`%c ${headerTitle}`, headerStyle);

        // QUERY INFORMATION SECTION
        console.groupCollapsed('Request:');

        // Collection
        console.log('Collection:', schemaName);

        // Expression
        const builtIns = [
            "schema",
            "expression",
            "options",
            "filters",
            "filter",
            "changeTracking"
        ];

        for (const key in query) {
            if (builtIns.includes(key)) {
                continue;
            }

            console.groupCollapsed(`__${key}__`);
            console.log((query as any)[key]);
            console.groupEnd();
        }

        if (query.expression) {
            console.groupCollapsed('Expression:');
            console.log(query.expression);
            console.groupEnd();
        }

        // Filters
        if (query.filters && query.filters.length > 0) {
            console.groupCollapsed('Filters:');
            query.filters.forEach((filter, index) => {
                console.log(`Filter ${index + 1}:`, filter);
            });
            console.groupEnd();
        }

        // Options
        if (query.options) {
            console.groupCollapsed('Options:');

            // Clean up options for display
            const options = {
                skip: query.options.skip,
                take: query.options.take,
                sort: query.options.sort,
                min: query.options.min,
                max: query.options.max,
                count: query.options.count,
                sum: query.options.sum,
                distinct: query.options.distinct,
                fields: query.options.fields?.length ? query.options.fields : undefined
            };

            // Display as a table if possible
            console.table(
                Object.entries(options)
                    .filter(([_, value]) => value !== undefined)
                    .reduce((acc, [key, value]) => {
                        acc[key] = value;
                        return acc;
                    }, {} as any)
            );
            console.groupEnd();
        }

        // Change tracking
        const isTracking = query.changeTracking;
        console.log(
            `${isTracking ? '✓' : '✗'} Change Tracking:`,
            isTracking
        );

        console.groupEnd(); // End query details

        // RESULT SECTION
        if (error) {
            console.groupCollapsed(`Error:`, 'color: #F44336;');
            if (isCriticalError) {
                console.log('Exception thrown during query execution:');
            }
            console.error(error);
            console.groupEnd();
        } else {
            // Display the result with improved formatting
            const isArray = Array.isArray(result);

            console.groupCollapsed('Response:');

            if (isArray) {
                console.log(`Total Items: ${(result as any[]).length}`);

                if ((result as any[]).length > 0) {
                    // Show summary structure for large arrays
                    if ((result as any[]).length > 10) {
                        console.log('First 3 items:');
                        (result as any[]).slice(0, 3).forEach((item, i) => {
                            console.log(`Item ${i}:`, item);
                        });
                        console.log(`... and ${(result as any[]).length - 3} more items`);
                    } else {
                        // Show all items for smaller arrays
                        console.table(result);
                    }
                } else {
                    console.log('Empty result array');
                }
            } else {
                console.log(result);
            }

            console.groupEnd();
        }

        // Show duration with color based on speed
        console.log(
            `%cDuration:`,
            `color: ${headerColor};`,
            `${duration.toFixed(2)}ms (${speedText})`
        );

        console.groupEnd(); // End main group
    }

    destroy(done: (error?: any) => void): void {
        try {
            this.plugin.destroy(done);
        } catch (e: any) {
            done(e);
        }
    }

    bulkOperations<TEntity extends {}>(event: DbPluginBulkOperationsEvent<TEntity>, done: (result: EntityModificationResult<TEntity>, error?: any) => void): void {
        const { operation, schema } = event;
        const start = now();
        const operationId = Math.random().toString(36).substring(2, 8);

        // Create context for hooks and logging
        const context: BulkOperationsLogContext<TEntity> = {
            schema,
            operations: operation,
            duration: 0,
            operationId
        };

        // Call the request hook if defined
        if (this._hooks.onBulkOperationsRequest) {
            this._hooks.onBulkOperationsRequest(context);
        }

        try {
            this.plugin.bulkOperations(event, (result, error) => {
                const end = now();
                const duration = end - start;

                // Update context with result information
                context.result = result;
                context.error = error;
                context.duration = duration;
                context.isCriticalError = false;

                // Log bulk operations result
                this._logBulkOperationsResult(context);

                // Call the response hook if defined
                if (this._hooks.onBulkOperationsResponse) {
                    this._hooks.onBulkOperationsResponse(context);
                }

                done(result, error);
            });
        } catch (e: any) {
            const end = now();
            const duration = end - start;

            // Update context with error information
            context.error = e;
            context.duration = duration;
            context.isCriticalError = true;

            // Log the error
            this._logBulkOperationsResult(context);

            // Call the response hook if defined
            if (this._hooks.onBulkOperationsResponse) {
                this._hooks.onBulkOperationsResponse(context);
            }

            done(null as unknown as EntityModificationResult<TEntity>, e);
        }
    }

    private _logBulkOperationsResult<TEntity extends {}>(
        context: BulkOperationsLogContext<TEntity>
    ): void {
        // Skip logging if not in development environment
        if (!this._shouldLog) return;

        const { schema, operations, result, error, duration, isCriticalError } = context;
        const schemaName = schema.collectionName;

        if (this._logStyle === 'minimal') {
            if (error) {
                const errorType = isCriticalError ? 'CRITICAL ERROR' : 'Error';
                console.error(`${isCriticalError ? '💀' : '❌'} Bulk Operations ${errorType} [${schemaName}]:`, error);
            } else {
                console.log(`✅ Bulk Operations [${schemaName}] completed in ${duration.toFixed(2)}ms`);
            }
            return;
        }

        const pluginName = "constructor" in this.plugin ? ` [${this.plugin.constructor.name}]` : "";
        // Determine speed category and set appropriate styling
        let speedEmoji = '⚡'; // Fast
        let headerColor = '#4CAF50'; // Green for fast
        let speedText = 'FAST';

        if (duration > 1000) {
            speedEmoji = '🐢'; // Slow
            headerColor = '#F44336'; // Red for slow
            speedText = 'SLOW';
        } else if (duration > 300) {
            speedEmoji = '⏱️'; // Medium
            headerColor = '#FF9800'; // Orange for medium
            speedText = 'MEDIUM';
        }

        // Create appropriate header based on success/error
        const headerStyle = error
            ? `color: ${isCriticalError ? '#D50000' : '#F44336'}; font-weight: bold;`
            : `color: ${headerColor}; font-weight: bold;`;

        // Add operation count to the header
        let operationCount = '';
        if (!error && result) {
            const totalRequested = operations.adds.length + operations.removes.length + operations.updates.size;
            const totalCompleted = result.adds.length + result.removedCount + result.updates.length;
            operationCount = ` (${totalRequested} → ${totalCompleted})`;
        }

        const headerTitle = error
            ? `${isCriticalError ? '💀' : '❌'}${pluginName} BULK OPERATIONS ERROR: ${schemaName}`
            : `${speedEmoji}${pluginName} BULK OPERATIONS: ${schemaName}${operationCount}`;

        console.groupCollapsed(`%c ${headerTitle}`, headerStyle);

        // OPERATIONS INFORMATION SECTION
        console.groupCollapsed('Request:');

        // Show collection and summary
        console.log('Collection:', schemaName);

        // Display summary as a table
        console.log('Summary:');
        console.table({
            'Operations': {
                adds: operations.adds.length,
                removes: operations.removes.length,
                updates: operations.updates.size,
                total: operations.adds.length + operations.removes.length + operations.updates.size
            }
        });

        // Show operations in a structured format
        if (operations.adds.length > 0) {
            console.groupCollapsed(`Adds (${operations.adds.length}):`);

            if (operations.adds.length <= 5) {
                // Show all if there are just a few
                operations.adds.forEach((item, i) => {
                    console.log(`[${i}]:`, item);
                });
            } else {
                // Show sample of first 3 if there are many
                console.log(`Showing first 3 of ${operations.adds.length}:`);
                operations.adds.slice(0, 3).forEach((item, i) => {
                    console.log(`[${i}]:`, item);
                });
                console.log(`... and ${operations.adds.length - 3} more`);
            }

            console.groupEnd();
        }

        if (operations.removes.length > 0) {
            console.groupCollapsed(`Removes (${operations.removes.length}):`);

            if (operations.removes.length <= 5) {
                // Show all if there are just a few
                operations.removes.forEach((item, i) => {
                    console.log(`[${i}]:`, item);
                });
            } else {
                // Show sample of first 3 if there are many
                console.log(`Showing first 3 of ${operations.removes.length}:`);
                operations.removes.slice(0, 3).forEach((item, i) => {
                    console.log(`[${i}]:`, item);
                });
                console.log(`... and ${operations.removes.length - 3} more`);
            }

            console.groupEnd();
        }

        if (operations.updates.size > 0) {
            console.groupCollapsed(`Updates (${operations.updates.size}):`);

            const updates = Array.from(operations.updates.entries());

            if (updates.length <= 5) {
                // Show all if there are just a few
                updates.forEach(([id, data], i) => {
                    console.groupCollapsed(`[${i}] ID: ${id}`);
                    console.log('Delta:', data.delta);
                    console.groupEnd();
                });
            } else {
                // Show sample of first 3 if there are many
                console.log(`Showing first 3 of ${updates.length}:`);
                updates.slice(0, 3).forEach(([id, data], i) => {
                    console.groupCollapsed(`[${i}] ID: ${id}`);
                    console.log('Delta:', data.delta);
                    console.groupEnd();
                });
                console.log(`... and ${updates.length - 3} more`);
            }

            console.groupEnd();
        }

        console.groupEnd(); // End operations details

        // RESULT SECTION
        if (error) {
            console.groupCollapsed(`Error:`, 'color: #F44336;');
            if (isCriticalError) {
                console.log('Exception thrown during operation execution:');
            }
            console.error(error);
            console.groupEnd();
        } else if (result) {
            // Display the results in a structured format
            console.groupCollapsed('Response:');

            // Summary information formatted as a table with before/after comparison
            console.log('Summary:');
            console.table({
                'Adds': { requested: operations.adds.length, completed: result.adds.length },
                'Removes': { requested: operations.removes.length, completed: result.removedCount },
                'Updates': { requested: operations.updates.size, completed: result.updates.length },
                'Total': {
                    requested: operations.adds.length + operations.removes.length + operations.updates.size,
                    completed: result.adds.length + result.removedCount + result.updates.length
                }
            });

            // Show result details
            if (result.adds.length > 0) {
                console.groupCollapsed(`Add Results (${result.adds.length}):`);

                if (result.adds.length <= 5) {
                    // Show all if there are just a few
                    result.adds.forEach((item, i) => {
                        console.log(`[${i}]:`, item);
                    });
                } else {
                    // Show sample of first 3 if there are many
                    console.log(`Showing first 3 of ${result.adds.length}:`);
                    result.adds.slice(0, 3).forEach((item, i) => {
                        console.log(`[${i}]:`, item);
                    });
                    console.log(`... and ${result.adds.length - 3} more`);
                }

                console.groupEnd();
            }

            if (result.updates.length > 0) {
                console.groupCollapsed(`Update Results (${result.updates.length}):`);

                if (result.updates.length <= 5) {
                    // Show all if there are just a few
                    result.updates.forEach((item, i) => {
                        console.log(`[${i}]:`, item);
                    });
                } else {
                    // Show sample of first 3 if there are many
                    console.log(`Showing first 3 of ${result.updates.length}:`);
                    result.updates.slice(0, 3).forEach((item, i) => {
                        console.log(`[${i}]:`, item);
                    });
                    console.log(`... and ${result.updates.length - 3} more`);
                }

                console.groupEnd();
            }

            if (result.removedCount > 0) {
                console.log(`Removed Count: ${result.removedCount}`);
            }

            console.groupEnd(); // End results group
        }

        // Show duration with color based on speed
        console.log(
            `%cDuration:`,
            `color: ${headerColor};`,
            `${duration.toFixed(2)}ms (${speedText})`
        );

        console.groupEnd(); // End main group
    }
}