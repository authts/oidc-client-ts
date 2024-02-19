import type { StateStore } from "./StateStore";

export class IndexedDbStore implements StateStore {
    async get(key: string): Promise<string | null> {
        return await this.getKey(key);
    }

    getAllKeys(): Promise<string[]> {
        return Promise.resolve([]);
    }

    async remove(key: string): Promise<string | null> {
        const item = await this.get(key);
        await this.delKey(key);
        return item;
    }

    async set(key: string, value: string): Promise<void> {
        await this.setKey(key, value);
    }

    async setKey(key: string, value: string) {
        const store = await this.createStore("big", "party");
        return await store("readwrite", (str: IDBObjectStore) => {
            str.put(value, key);
            return this.promisifyRequest(str.transaction);
        });
    }

    async getKey(key: string): Promise<string> {
        const store = await this.createStore("big", "party");
        return await store("readonly", (str) => {
            return this.promisifyRequest(str.get(key));
        }) as string;
    }

    async delKey(key: string): Promise<IDBRequest<undefined>> {
        const store = await this.createStore("big", "party");
        return await store("readwrite", (str) => {
            return this.promisifyRequest(str.delete(key));
        }) as IDBRequest<undefined>;
    }

    promisifyRequest<T = undefined>(
        request: IDBRequest<T> | IDBTransaction): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            (request as IDBTransaction).oncomplete = (request as IDBRequest<T>).onsuccess = () => resolve((request as IDBRequest<T>).result);
            (request as IDBTransaction).onabort = (request as IDBRequest<T>).onerror = () => reject((request as IDBRequest<T>).error);
        });
    }

    async createStore<T>(
        dbName: string,
        storeName: string,
    ): Promise<(txMode: IDBTransactionMode, callback: (store: IDBObjectStore) => T | PromiseLike<T>) => Promise<T>> {
        const request = indexedDB.open(dbName);
        request.onupgradeneeded = () => request.result.createObjectStore(storeName);
        const db = await this.promisifyRequest<IDBDatabase>(request);

        return async (
            txMode: IDBTransactionMode,
            callback: (store: IDBObjectStore) => T | PromiseLike<T>,
        ) => {
            const tx = db.transaction(storeName, txMode);
            const store = tx.objectStore(storeName);
            return await callback(store);
        };
    }

}
