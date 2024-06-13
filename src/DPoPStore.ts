/**
 * @public
 */
export interface DPoPStore<T extends CryptoKeyPair | null> {
    set(key: string, value: T): Promise<void>;
    get(key: string): Promise<T>;
    remove(key: string): Promise<T>;
    getAllKeys(): Promise<string[]>;
}
