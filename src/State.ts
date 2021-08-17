// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, random } from "./utils";
import { StateStore } from "./StateStore";

export class State {
    public readonly id: any;
    public readonly data: any;
    public readonly created: number;
    public readonly request_type: any;

    constructor({
        id, data, created, request_type
    }: any = {}) {
        this.id = id || random();
        this.data = data;

        if (typeof created === "number" && created > 0) {
            this.created = created;
        }
        else {
            this.created = Math.floor(Date.now() / 1000);
        }
        this.request_type =  request_type;
    }

    toStorageString() {
        Log.debug("State.toStorageString");
        return JSON.stringify({
            id: this.id,
            data: this.data,
            created: this.created,
            request_type: this.request_type
        });
    }

    static fromStorageString(storageString: string) {
        Log.debug("State.fromStorageString");
        return new State(JSON.parse(storageString));
    }

    static async clearStaleState(storage: StateStore, age: number) {
        const cutoff = Date.now() / 1000 - age;

        const keys = await storage.getAllKeys();
        Log.debug("State.clearStaleState: got keys", keys);

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const item = await storage.get(key);
            let remove = false;

            if (item) {
                try {
                    const state = State.fromStorageString(item);

                    Log.debug("State.clearStaleState: got item from key: ", key, state.created);
                    if (state.created <= cutoff) {
                        remove = true;
                    }
                }
                catch (e) {
                    Log.error("State.clearStaleState: Error parsing state for key", key, e.message);
                    remove = true;
                }
            }
            else {
                Log.debug("State.clearStaleState: no item in storage for key: ", key);
                remove = true;
            }

            if (remove) {
                Log.debug("State.clearStaleState: removed item for key: ", key);
                void storage.remove(key);
            }
        }
    }
}
