// import { describe, it, expect, vi } from 'vitest';
// import { TrampolinePipeline, Processor } from './TrampolinePipeline'; // Adjust path based on actual file name

// describe('TrampolinePipeline', () => {

//     it('should execute a single synchronous step', () => {
//         return new Promise<void>((resolve) => {
//             const pipeline = new TrampolinePipeline<number>()
//                 .add<number>( (data, cb) => cb(data + 1) );

//             pipeline.execute(10, (result, error) => {
//                 expect(error).toBeUndefined();
//                 expect(result).toBe(11);
//                 resolve();
//             });
//         });
//     });

//     it('should execute multiple synchronous steps', () => {
//         return new Promise<void>((resolve) => {
//             const pipeline = new TrampolinePipeline<number>()
//                 .add<number>( (data, cb) => cb(data + 1) )
//                 .add<string>( (data, cb) => cb(`Result: ${data}`) )
//                 .add<string>( (data, cb) => cb(`${data}!`));

//             pipeline.execute(10, (result, error) => {
//                 expect(error).toBeUndefined();
//                 expect(result).toBe('Result: 11!');
//                 resolve();
//             });
//         });
//     });

//     it('should execute a single asynchronous step', () => {
//         vi.useFakeTimers();
//         return new Promise<void>(async (resolve) => {
//             const pipeline = new TrampolinePipeline<string>()
//                 .add<string>((data, cb) => {
//                     setTimeout(() => cb(`${data} world`), 100);
//                 });

//             pipeline.execute('hello', (result, error) => {
//                 expect(error).toBeUndefined();
//                 expect(result).toBe('hello world');
//                 resolve();
//             });

//             await vi.advanceTimersByTimeAsync(100);
//             vi.useRealTimers(); // Restore real timers
//         });
//     });

//     it('should execute multiple asynchronous steps', () => {
//         vi.useFakeTimers();
//         return new Promise<void>(async (resolve) => {
//             const pipeline = new TrampolinePipeline<number>()
//                 .add<number>((data, cb) => setTimeout(() => cb(data * 2), 50))
//                 .add<number>((data, cb) => setTimeout(() => cb(data + 5), 50));

//             pipeline.execute(10, (result, error) => {
//                 expect(error).toBeUndefined();
//                 expect(result).toBe(25);
//                 resolve();
//             });

//             await vi.advanceTimersByTimeAsync(50); // First timeout
//             await vi.advanceTimersByTimeAsync(50); // Second timeout
//             vi.useRealTimers();
//         });
//     });

//     it('should execute mixed synchronous and asynchronous steps', () => {
//         vi.useFakeTimers();
//         return new Promise<void>(async (resolve) => {
//             const pipeline = new TrampolinePipeline<string>()
//                 .add<string>((data, cb) => cb(`${data} sync1`)) // Sync
//                 .add<string>((data, cb) => setTimeout(() => cb(`${data} async1`), 50)) // Async
//                 .add<string>((data, cb) => cb(`${data} sync2`)) // Sync
//                 .add<string>((data, cb) => setTimeout(() => cb(`${data} async2`), 50)); // Async

//             pipeline.execute('start', (result, error) => {
//                 expect(error).toBeUndefined();
//                 expect(result).toBe('start sync1 async1 sync2 async2');
//                 resolve();
//             });

//             await vi.advanceTimersByTimeAsync(50);
//             await vi.advanceTimersByTimeAsync(50);
//             vi.useRealTimers();
//         });
//     });

//     it('should handle an empty pipeline correctly', () => {
//         return new Promise<void>((resolve) => {
//             const pipeline = new TrampolinePipeline<{ val: string }>();
//             const initial = { val: 'test' };

//             pipeline.execute(initial, (result, error) => {
//                 expect(error).toBeUndefined();
//                 expect(result).toBe(initial); // Should return initial data
//                 resolve();
//             });
//         });
//     });

//     it('should handle errors passed via callback', () => {
//         return new Promise<void>((resolve) => {
//             const pipeline = new TrampolinePipeline<number>()
//                 .add<number>((data, cb) => cb(data + 1))
//                 .add<number>((data, cb) => cb(0, new Error('Something went wrong')))
//                 .add<number>((data, cb) => cb(data * 10)); // This step should not run

//             const finalCallback = vi.fn((result, error) => {
//                 expect(error).toBeInstanceOf(Error);
//                 expect(error.message).toBe('Something went wrong');
//                 // Result might be intermediate, depending on when error occurred
//                 // For simplicity, just check the error here.
//                 resolve();
//             });

//             pipeline.execute(5, finalCallback);
//         });
//     });

//     it('should handle errors thrown synchronously by a processor', () => {
//         return new Promise<void>((resolve) => {
//             const pipeline = new TrampolinePipeline<string>()
//                 .add<string>((data, cb) => cb(data.toUpperCase()))
//                 .add<string>((data, cb) => {
//                     if (data === 'HELLO') {
//                         throw new Error('Sync throw error');
//                     }
//                     cb(data);
//                 })
//                 .add<string>((data, cb) => cb(`${data}!!!`)); // Should not run

//             const finalCallback = vi.fn((result, error) => {
//                 expect(error).toBeInstanceOf(Error);
//                 expect(error.message).toBe('Sync throw error');
//                 resolve();
//             });

//             pipeline.execute('hello', finalCallback);
//         });
//     });

//      it('should not cause stack overflow with many synchronous steps', () => {
//         return new Promise<void>((resolve) => {
//             let pipeline = new TrampolinePipeline<number>();
//             const steps = 5000; // Number of synchronous steps

//             for (let i = 0; i < steps; i++) {
//                 pipeline = pipeline.add<number>((data, cb) => cb(data + 1));
//             }

//             pipeline.execute(0, (result, error) => {
//                 expect(error).toBeUndefined();
//                 expect(result).toBe(steps);
//                 resolve();
//             });
//         });
//     });

//     it('should allow multiple executions with correct state reset', () => {
//         return new Promise<void>(async (resolve) => {
//             vi.useFakeTimers();
//             const pipeline = new TrampolinePipeline<number>()
//                 .add<number>((data, cb) => setTimeout(() => cb(data + 1), 50))
//                 .add<number>((data, cb) => cb(data * 2));

//             // First execution
//             let result1: number | undefined;
//             let error1: any;
//             pipeline.execute<number>(10, (res, err) => {
//                 result1 = res;
//                 error1 = err;
//             });
//             await vi.advanceTimersByTimeAsync(50);
//             expect(error1).toBeUndefined();
//             expect(result1).toBe(22); // (10 + 1) * 2

//             // Second execution
//             let result2: number | undefined;
//             let error2: any;
//             pipeline.execute<number>(5, (res, err) => {
//                 result2 = res;
//                 error2 = err;
//             });
//             await vi.advanceTimersByTimeAsync(50);
//             expect(error2).toBeUndefined();
//             expect(result2).toBe(12); // (5 + 1) * 2

//             vi.useRealTimers();
//             resolve();
//         });
//     });

//     // Add more tests as needed, e.g., complex data types, edge cases
// }); 