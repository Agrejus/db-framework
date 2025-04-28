/**
 * Type definition for an asynchronous function that takes data and a callback.
 * TIn: The input data type.
 * TOut: The output data type (passed to the callback).
 */
export type Processor<TIn, TOut> = (data: TIn, callback: (result: TOut, error?: any) => void) => void;

// Return type for a step execution: Either the next step function or null if waiting/done.
type StepResult<TData> = TrampolineStep<TData> | null;
type TrampolineStep<TData> = () => StepResult<TData>;

export class TrampolinePipeline<TInitial, TCurrent = TInitial> {
    private _list: Processor<any, any>[] = [];
    private _hasErrored: boolean = false; // Flag to prevent calling done on error

    pipe<TNext>(processor: Processor<TCurrent, TNext>) {
        this._list.push(processor);
        return this as unknown as TrampolinePipeline<TInitial, TNext>;
    }

    filter<TFinal>(initialData: TInitial, done: (data: TFinal, error?: any) => void) {

        this._hasErrored = false; // Reset error flag on new execution
        if (this._list.length === 0) {
            queueMicrotask(() => done(initialData as any as TFinal));
            return;
        }

        let index = 0;
        let currentData: any = initialData;
        let isRunning = false; // Guard against overlapping trampoline calls

        try {
            // --- Revised Completion Logic --- (Moved up for clarity)
            const finalStepSentinel = (): StepResult<any> => { // A special step function for the very end
                // Only call done if no error has occurred
                if (!this._hasErrored) {
                    queueMicrotask(() => done(currentData as TFinal));
                }
                return null; // Stop the trampoline
            };

            const createStepRevised = (idx: number): TrampolineStep<any> => {
                return () => {
                    if (this._hasErrored) return null; // Stop if an error occurred elsewhere

                    if (idx >= this._list.length) {
                        return finalStepSentinel(); // Execute the dedicated final step
                    }

                    const processor = this._list[idx];
                    // Initialize syncCallbackResult to null to satisfy StepResult type
                    let syncCallbackResult: StepResult<any> = null;
                    let calledSync = false;

                    try {
                        processor(currentData, (result, error) => {
                            // --- Error Handling ---
                            if (error) {
                                console.error(`Error reported by processor at index ${idx}:`, error);
                                this._hasErrored = true; // Set flag
                                // Throw the error to be caught by outer try...catch blocks
                                throw error;
                            }
                            // --- /Error Handling ---

                            // If no error, proceed as before
                            currentData = result;
                            index = idx + 1; // Update index for the next step
                            const nextStep = createStepRevised(index); // Use updated index

                            if (isRunning) {
                                // Callback was synchronous
                                syncCallbackResult = nextStep; // Store next step function
                                calledSync = true;
                            } else {
                                // Callback was asynchronous, restart trampoline
                                trampoline(nextStep);
                            }
                        });
                    } catch (error) {
                        if (!this._hasErrored) { // Check flag to avoid double logging if error was from callback
                            console.error(`Error thrown by processor at index ${idx} or its callback:`, error);
                            this._hasErrored = true;
                        }
                        // Rethrow to be caught by the trampoline's catch block
                        throw error;
                    }

                    if (calledSync) {
                        // Return the next step function for the sync loop
                        return syncCallbackResult;
                    } else {
                        // Pause trampoline for async, loop will stop as step returns null
                        return null;
                    }
                };
            };

            // The trampoline loop
            const trampoline = (step: TrampolineStep<any> | null) => {

                if (isRunning) {
                    return;
                }

                isRunning = true;
                let currentStep = step;

                while (typeof currentStep === 'function') {
                    try {
                        // Stop immediately if an error was flagged elsewhere
                        if (this._hasErrored) {
                            currentStep = null;
                            break;
                        }
                        currentStep = currentStep(); // Execute step, get next step or null
                    } catch (trampolineError) {
                        // Catch errors propagated from step execution (processor or callback errors)
                        if (!this._hasErrored) { // Avoid double logging
                            console.error("Error during trampoline step execution:", trampolineError);
                            this._hasErrored = true;
                        }
                        currentStep = null; // Stop the loop
                        // We don't call `done` here because an error occurred.
                        // The application should handle the uncaught exception if desired.
                        break; // Explicitly break loop on error
                    }
                }
                // Loop ends when currentStep is null or loop is broken by error
                isRunning = false;

                // Completion check is now handled by finalStepSentinel ensuring `done` isn't called on error.
            };

            // --- Start the process ---
            index = 0; // Reset index
            currentData = initialData; // Reset data
            trampoline(createStepRevised(0)); // Start with the revised step creator
        } catch (error: any) {
            done(currentData, error);
        }
    }
}