// import { describe, it, expect, beforeEach, vi } from 'vitest';
// import { CompiledSchema, IDbPlugin, EntityModificationResult, InferType } from '@agrejus/db-framework-core';
// import { DataContext } from './DataContext';
// import { DbSet } from './DbSet';

// // Mock DbSet class
// vi.mock('./DbSet', () => {
//     return {
//         DbSet: vi.fn().mockImplementation(() => ({
//             changeTracker: {
//                 saveChanges: vi.fn()
//             }
//         }))
//     };
// });

// // Mock schema
// const mockSchema: CompiledSchema<any> = {
//     key: 1,
//     tableName: 'test',
//     hasIdentities: false,
//     idPropertyNames: [],
//     hashType: 'Object' as any,
//     hash: () => '',
//     getHashType: () => 'Object' as const,
//     compare: () => true,
//     deserialize: (entity: any) => entity,
//     clone: (entity: any) => entity,
//     strip: (entity: any) => entity,
//     prepare: (entity: any) => entity,
//     merge: (dest: any, source: any) => dest,
//     getIds: () => [''],
//     enrich: (entity: any) => entity,
//     hasIdentityKeys: false
// };

// // Mock DB Plugin
// class MockDbPlugin implements IDbPlugin {

//     query<TEntity extends {}>(schema: CompiledSchema<TEntity>, expression: any, done: (entities: InferType<TEntity>[], error?: any) => void): void {
//         done([], null);
//     }

//     all<TEntity extends {}>(schema: CompiledSchema<TEntity>, done: (entities: InferType<TEntity>[], error?: any) => void): void {
//         done([], null);
//     }

//     get<TEntity extends {}>(schema: CompiledSchema<TEntity>, ids: string[], done: (entities: InferType<TEntity>[], error?: any) => void): void {
//         done([], null);
//     }

//     destroy(done: (error?: any) => void): void {
//         done(null);
//     }

//     bulkOperations<TEntity extends {}>(schema: CompiledSchema<TEntity>, operations: any, done: (result: EntityModificationResult<TEntity>, error?: any) => void): void {
//         done({ adds: [], updates: [], removedCount: 0 }, null);
//     }
// }

// describe('DataContext', () => {
//     let context: DataContext;
//     let mockDbPlugin: IDbPlugin;

//     beforeEach(() => {
//         mockDbPlugin = new MockDbPlugin();
//         context = new DataContext(mockDbPlugin);
//     });

//     describe('dbset', () => {
//         it('should create and store a new DbSet instance', () => {
//             // Access the protected dbset method using type assertion
//             const dbset = (context as any).dbset(mockSchema);

//             expect(dbset).toBeDefined();
//             // Verify that DbSet was constructed with correct parameters
//             expect(vi.mocked(DbSet)).toHaveBeenCalledWith(mockDbPlugin, mockSchema);
//         });

//         it('should return the same DbSet instance for the same schema key', () => {
//             const dbset1 = (context as any).dbset(mockSchema);
//             const dbset2 = (context as any).dbset(mockSchema);

//             expect(dbset1).toBe(dbset2);
//         });
//     });

//     describe('saveChanges', () => {
//         it('should save changes for all DbSets', () => {
//             return new Promise<void>((done) => {
//                 // Create some DbSets
//                 const dbset1 = (context as any).dbset({ ...mockSchema, key: 1 });
//                 const dbset2 = (context as any).dbset({ ...mockSchema, key: 2 });

//                 // Mock successful saves
//                 dbset1.changeTracker.saveChanges = vi.fn().mockImplementation((callback: any) => callback(2, null));
//                 dbset2.changeTracker.saveChanges = vi.fn().mockImplementation((callback: any) => callback(3, null));

//                 context.saveChanges((result, error) => {
//                     expect(error).toBeNull();
//                     expect(result).toBe(5); // 2 + 3
//                     expect(dbset1.changeTracker.saveChanges).toHaveBeenCalled();
//                     expect(dbset2.changeTracker.saveChanges).toHaveBeenCalled();
//                     done();
//                 });
//             });
//         });

//         it('should handle errors during save', () => {
//             return new Promise<void>((done) => {
//                 const dbset = (context as any).dbset(mockSchema);
//                 const mockError = new Error('Save failed');

//                 dbset.changeTracker.saveChanges = vi.fn().mockImplementation((callback: any) => callback(0, mockError));

//                 context.saveChanges((result, error) => {
//                     expect(error).toEqual([mockError]);
//                     expect(result).toBe(0);
//                     done();
//                 });
//             });
//         });
//     });

//     describe('saveChangesAsync', () => {
//         it('should return a promise that resolves with the total number of changes', async () => {
//             const dbset = (context as any).dbset(mockSchema);
//             dbset.changeTracker.saveChanges = vi.fn().mockImplementation((callback: any) => callback(5, null));

//             const result = await context.saveChangesAsync();
//             expect(result).toBe(5);
//         });

//         it('should reject the promise when there are errors', async () => {
//             const dbset = (context as any).dbset(mockSchema);
//             const mockError = new Error('Save failed');

//             dbset.changeTracker.saveChanges = vi.fn().mockImplementation((callback: any) => callback(0, mockError));

//             await expect(context.saveChangesAsync()).rejects.toEqual([mockError]);
//         });
//     });

//     describe('previewChanges', () => {
//         it('should be implemented', () => {
//             expect(context.previewChanges).toBeDefined();
//             // Add more specific tests once the method is implemented
//         });
//     });
// });