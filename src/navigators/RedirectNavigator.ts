// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "../utils";
import type { UserManagerSettingsStore } from "../UserManagerSettings";
import type { INavigator } from "./INavigator";
import type { IWindow } from "./IWindow";

/**
 * @public
 */
export interface RedirectParams {
    redirectMethod?: "replace" | "assign";
}

/**
 * @internal
 */
export class RedirectNavigator implements INavigator {
    private readonly _logger = new Logger("RedirectNavigator");

    constructor(private _settings: UserManagerSettingsStore) {}

    public async prepare({
        redirectMethod = this._settings.redirectMethod,
    }: RedirectParams): Promise<IWindow> {
        this._logger.create("prepare");
        const redirect = window.location[redirectMethod].bind(window.location) as (url: string) => never;
        let abort: (reason: Error) => void;
        return {
            navigate: async (params): Promise<never> => {
                this._logger.create("navigate");
                const promise = new Promise((resolve, reject) => {
                    abort = reject;
                    window.addEventListener("beforeunload", () => resolve(null));
                });
                redirect(params.url);
                return await (promise as Promise<never>);
            },
            close: () => {
                this._logger.create("close");
                abort?.(new Error("Redirect aborted"));
                window.stop();
            },
        };
    }
}
