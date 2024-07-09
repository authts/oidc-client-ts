/**
 * @public
 */
export interface DPoPStore {
    set(key: string, value: DPoPState): Promise<void>;
    get(key: string): Promise<DPoPState>;
    remove(key: string): Promise<DPoPState>;
    getAllKeys(): Promise<string[]>;
}

/**
 * @public
 */
export class DPoPState {
    public constructor(
        public readonly keys: CryptoKeyPair,
        public nonce?: string,
    ) { }
}
