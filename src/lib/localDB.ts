import { get, set, del, clear, keys } from 'idb-keyval';

export const localDB = {
  get: async <T>(key: string): Promise<T | undefined> => {
    try {
      return await get<T>(key);
    } catch (error) {
      console.error(`Error getting key ${key} from IndexedDB`, error);
      return undefined;
    }
  },
  set: async (key: string, value: any): Promise<void> => {
    try {
      await set(key, value);
    } catch (error) {
      console.error(`Error setting key ${key} in IndexedDB`, error);
    }
  },
  remove: async (key: string): Promise<void> => {
    try {
      await del(key);
    } catch (error) {
      console.error(`Error removing key ${key} from IndexedDB`, error);
    }
  },
  clearAll: async (): Promise<void> => {
    try {
      await clear();
    } catch (error) {
      console.error(`Error clearing IndexedDB`, error);
    }
  },
  getKeys: async (): Promise<IDBValidKey[]> => {
    try {
      return await keys();
    } catch (error) {
      console.error('Error getting keys from IndexedDB', error);
      return [];
    }
  }
};
