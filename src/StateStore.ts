/**
 * @public
 */
export interface StateStore<T extends string | null> {
    set(key: string, value: T): Promise<void>;
    get(key: string): Promise<T>;
    remove(key: string): Promise<T>;
    getAllKeys(): Promise<string[]>;
}
