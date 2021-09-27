// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "../utils";
import { PopupWindow, PopupWindowParams } from "./PopupWindow";
import type { INavigator } from "./INavigator";
import type { UserManagerSettingsStore } from "../UserManagerSettings";

export class PopupNavigator implements INavigator {
    constructor(private _settings: UserManagerSettingsStore) {}

    public async prepare(params: PopupWindowParams): Promise<PopupWindow> {
        return new PopupWindow({ ...this._settings, ...params });
    }

    public async callback(url: string | undefined, keepOpen: boolean, delimiter: string): Promise<void> {
        Log.debug("PopupNavigator.callback");

        PopupWindow.notifyOpener(url, keepOpen, delimiter);
    }
}
