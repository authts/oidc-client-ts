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
        const redirect = window.location[redirectMethod].bind(window.location) as (url: string) => never;
        return {
            navigate: (params) => redirect(params.url),
            close: () => this._logger.warn("close: cannot close the current window"),
        };
    }
}
