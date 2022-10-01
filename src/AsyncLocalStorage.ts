import type { AsyncStorage } from "./AsyncStorage";
import { Logger } from "./utils";

/**
 * @public
 */
export class AsyncLocalStorage implements AsyncStorage {
    private readonly _logger = new Logger("AsyncLocalStorage");

    public clear(): Promise<void> {
        this._logger.create("clear");
        localStorage.clear();
        return Promise.resolve();
    }

    public getItem(key: string): Promise<string | null> {
        this._logger.create(`getItem('${key}')`);
        const item = localStorage.getItem(key);
        return Promise.resolve(item);
    }

    public setItem(key: string, value: string): Promise<void> {
        this._logger.create(`setItem('${key}')`);
        localStorage.setItem(key, value);
        return Promise.resolve();
    }

    public removeItem(key: string): Promise<void> {
        this._logger.create(`removeItem('${key}')`);
        localStorage.removeItem(key);
        return Promise.resolve();
    }

    public get length(): Promise<number> {
        return Promise.resolve(localStorage.length);
    }

    public key(index: number): Promise<string | null> {
        return Promise.resolve(localStorage.key(index));
    }
}
