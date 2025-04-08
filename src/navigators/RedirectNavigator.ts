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
    redirectTarget?: "top" | "self";
}

/**
 * @internal
 */
export class RedirectNavigator implements INavigator {
    private readonly _logger = new Logger("RedirectNavigator");

    constructor(private _settings: UserManagerSettingsStore) {}

    public async prepare({
        redirectMethod = this._settings.redirectMethod,
        redirectTarget = this._settings.redirectTarget,
    }: RedirectParams): Promise<IWindow> {
        this._logger.create("prepare");
        let targetWindow = window.self as Window;

        if (redirectTarget === "top") {
            targetWindow = window.top ?? window.self;
        }
    
        const redirect = targetWindow.location[redirectMethod].bind(targetWindow.location) as (url: string) => never;
        let abort: (reason: Error) => void;
        return {
            navigate: async (params): Promise<never> => {
                this._logger.create("navigate");
                // We use a promise that never resolves to block the caller
                const promise = new Promise((resolve, reject) => {
                    abort = reject;
                });
                redirect(params.url);
                return await (promise as Promise<never>);
            },
            close: () => {
                this._logger.create("close");
                abort?.(new Error("Redirect aborted"));
                targetWindow.stop();
            },
        };
    }

    public async callback(): Promise<void> {
        return;
    }
}
