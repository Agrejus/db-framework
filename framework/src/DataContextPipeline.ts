/**
 * Type definition for an asynchronous function that takes data and a callback.
 * TIn: The input data type.
 * TOut: The output data type (passed to the callback).
 */
export type PipelineFilter<TIn, TOut> = (data: TIn, done: (result: TOut, error?: any) => void) => void;

/**
 * Composer class to build and execute a chain of asynchronous functions
 * by creating a nested function structure.
 * TInitial: The input type of the very first function in the chain.
 * TCurrent: The output type of the *last* function added to the chain.
 */
export class Pipeline<TInitial, TCurrent = TInitial> {
    // Stores the function composed so far.
    private composed: PipelineFilter<TInitial, TCurrent>;

    // Private constructor: Use Composer.start() or add() to create instances.
    private constructor(processor: PipelineFilter<TInitial, TCurrent>) {
        this.composed = processor;
    }

    /**
     * Factory function to start the composition chain.
     * TInitial: The initial input type for the first function.
     * @returns A new Composer instance initialized with an identity function.
     */
    static create<TInitial>(): Pipeline<TInitial, TInitial> {
        // Start with an identity function: (data, callback) => callback(data)
        const identity: PipelineFilter<TInitial, TInitial> = (data, done) => done(data);
        return new Pipeline<TInitial, TInitial>(identity);
    }

    /**
     * Adds a new asynchronous function to the composition chain.
     * TNext: The output type of the function being added.
     * @param processor The AsyncFunc step to add.
     * @returns A new Composer instance representing the chain extended with the new function.
     */
    add<TNext>(processor: PipelineFilter<TCurrent, TNext>): Pipeline<TInitial, TNext> {
        const previous = this.composed;

        // Create the new composed function by nesting the callbacks
        const next: PipelineFilter<TInitial, TNext> = (initialData, finalCallback) => {
            // Execute the previous chain
            previous(initialData, (currentResult: TCurrent, currentError) => {

                if (currentError) {
                    throw currentError
                }

                // When the previous chain completes, execute the new function
                processor(currentResult, (nextResult: TNext, nextError) => {
               

                    if (nextError) {
                        throw nextError
                    }

                    // When the new function completes, call the final callback
                    finalCallback(nextResult);
                });
            });
        };

        // Return a new composer holding the newly composed function
        return new Pipeline<TInitial, TNext>(next);
    }

    /**
     * Executes the fully composed chain of asynchronous functions.
     * @param initialData The initial input data for the first function.
     * @param done The callback to receive the final result.
     */
    execute(initialData: TInitial, done: (result: TCurrent, error?: any) => void): void {
        // Execute the single, fully composed function.
        // There's no loop or recursion here during execution.
        this.composed(initialData, done);
    }
}