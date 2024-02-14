import { registerPlugin } from '@capacitor/core';
import type { ICapacitorRealmPlugin } from './definitions';

const CapacitorRealm = registerPlugin<ICapacitorRealmPlugin>('CapacitorRealm', {
  web: () => import('./web').then((m) => new m.CapacitorRealmWeb()),
});

export * from './definitions';
export { CapacitorRealm };
export { CapacitorRealmPlugin } from './CapacitorRealmPlugin';
export { electronBridge } from './CapacitorRealmElectronBridge';
