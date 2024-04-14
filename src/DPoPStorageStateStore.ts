import { IndexedDbCryptoKeyPairStore } from "./IndexedDbCryptoKeyPairStore";
import { WebStorageStateStore } from "./WebStorageStateStore";
import type { AsyncStorage } from "./AsyncStorage";
import type { StateStore } from "./StateStore";

export class DPoPStorageStateStore extends WebStorageStateStore implements StateStore<string | null | CryptoKeyPair> {
    readonly dpop_key: string = "oidc.dpop";

    public constructor({
        prefix = "oidc.",
        store = localStorage,
    }: { prefix?: string; store?: AsyncStorage | Storage } = {}) {
        super({ prefix, store });
    }

    public async set(key: string, value: string | CryptoKeyPair): Promise<void> {
        if (key === this.dpop_key) {
            await IndexedDbCryptoKeyPairStore.set(key, value as CryptoKeyPair);
        } else {
            await super.set(key, value as string);
        }
    }

    public async get(key: string): Promise<string | null> {
        return await super.get(key);
    }

    public async getDpop(key: string): Promise<CryptoKeyPair | null> {
        return await IndexedDbCryptoKeyPairStore.get(key);
    }

    public async remove(key: string): Promise<string | null> {
        await IndexedDbCryptoKeyPairStore.remove(this.dpop_key);
        return await super.remove(key);
    }

    public async getAllKeys(): Promise<string[]> {
        const keys = await super.getAllKeys();
        const dpopKeys = await IndexedDbCryptoKeyPairStore.getAllKeys();
        keys.push(...dpopKeys);
        return keys;
    }
}
