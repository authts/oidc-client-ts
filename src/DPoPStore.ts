/**
 * @public
 */
export interface DPoPStore {
    set(key: string, value: CryptoKeyPair): Promise<void>;
    get(key: string): Promise<CryptoKeyPair>;
    remove(key: string): Promise<CryptoKeyPair>;
    getAllKeys(): Promise<string[]>;
}
