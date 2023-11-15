// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, CryptoUtils, Timer } from "./utils";
import type { StateStore } from "./StateStore";

/**
 * @public
 */
export class State {
    public readonly id: string;
    public readonly created: number;
    public readonly request_type: string | undefined;
    public readonly url_state: string | undefined;

    /** custom "state", which can be used by a caller to have "data" round tripped */
    public readonly data?: unknown;

    public constructor(args: {
        id?: string;
        data?: unknown;
        created?: number;
        request_type?: string;
        url_state?: string;
    }) {
        this.id = args.id || CryptoUtils.generateUUIDv4();
        this.data = args.data;

        if (args.created && args.created > 0) {
            this.created = args.created;
        }
        else {
            this.created = Timer.getEpochTime();
        }
        this.request_type = args.request_type;
        this.url_state = args.url_state;
    }

    public toStorageString(): string {
        new Logger("State").create("toStorageString");
        return JSON.stringify({
            id: this.id,
            data: this.data,
            created: this.created,
            request_type: this.request_type,
            url_state: this.url_state,
        });
    }

    public static fromStorageString(storageString: string): Promise<State> {
        Logger.createStatic("State", "fromStorageString");
        return Promise.resolve(new State(JSON.parse(storageString)));
    }

    public static async clearStaleState(storage: StateStore, age: number): Promise<void> {
        const logger = Logger.createStatic("State", "clearStaleState");
        const cutoff = Timer.getEpochTime() - age;

        const keys = await storage.getAllKeys();
        logger.debug("got keys", keys);

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const item = await storage.get(key);
            let remove = false;

            if (item) {
                try {
                    const state = await State.fromStorageString(item);

                    logger.debug("got item from key:", key, state.created);
                    if (state.created <= cutoff) {
                        remove = true;
                    }
                }
                catch (err) {
                    logger.error("Error parsing state for key:", key, err);
                    remove = true;
                }
            }
            else {
                logger.debug("no item in storage for key:", key);
                remove = true;
            }

            if (remove) {
                logger.debug("removed item for key:", key);
                void storage.remove(key);
            }
        }
    }
}
