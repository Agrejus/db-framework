import { registerPlugin } from '@capacitor/core';
import type { ICapacitorSqlitePlugin } from './definitions';

const CapacitorSqlite = registerPlugin<ICapacitorSqlitePlugin>('CapacitorSqlite', {
  web: () => import('./web').then((m) => new m.CapacitorSqliteWeb()),
});

export * from './definitions';
export { CapacitorSqlite };
export { CapacitorSqlitePlugin } from './CapacitorSqlitePlugin';
export { createBridge } from './CapacitorSqliteElectronBridge';
