export class IndexedDbCryptoKeyPairStore {
    static dbName = "oidc";
    static storeName = "dpop";

    static async get(key: string): Promise<CryptoKeyPair | null> {
        const store = await this.createStore(this.dbName, this.storeName);
        return await store("readonly", (str) => {
            return this.promisifyRequest(str.get(key));
        }) as CryptoKeyPair;
    }

    static async getAllKeys(): Promise<string[]> {
        const store = await this.createStore(this.dbName, this.storeName);
        return await store("readonly", (str) => {
            return this.promisifyRequest(str.getAllKeys());
        }) as string[];
    }

    static async remove(key: string): Promise<CryptoKeyPair | null> {
        const item = await this.get(key);
        const store = await this.createStore(this.dbName, this.storeName);
        await store("readwrite", (str) => {
            return this.promisifyRequest(str.delete(key));
        });
        return item;
    }

    static async set(key: string, value: CryptoKeyPair): Promise<void> {
        const store = await this.createStore(this.dbName, this.storeName);
        await store("readwrite", (str: IDBObjectStore) => {
            str.put(value, key);
            return this.promisifyRequest(str.transaction);
        });
    }

    static promisifyRequest<T = undefined>(
        request: IDBRequest<T> | IDBTransaction): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            (request as IDBTransaction).oncomplete = (request as IDBRequest<T>).onsuccess = () => resolve((request as IDBRequest<T>).result);
            (request as IDBTransaction).onabort = (request as IDBRequest<T>).onerror = () => reject((request as IDBRequest<T>).error);
        });
    }

    static async createStore<T>(
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
