// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "../utils";
import { PopupWindow, type PopupWindowParams } from "./PopupWindow";
import type { INavigator } from "./INavigator";
import type { UserManagerSettingsStore } from "../UserManagerSettings";

/**
 * @internal
 */
export class PopupNavigator implements INavigator {
    private readonly _logger = new Logger("PopupNavigator");

    constructor(private _settings: UserManagerSettingsStore) { }

    public async prepare({
        popupWindowFeatures = this._settings.popupWindowFeatures,
        popupWindowTarget = this._settings.popupWindowTarget,
        popupSignal,
    }: PopupWindowParams): Promise<PopupWindow> {
        return new PopupWindow({ popupWindowFeatures, popupWindowTarget, popupSignal });
    }

    public async callback(url: string, { keepOpen = false }): Promise<void> {
        this._logger.create("callback");

        PopupWindow.notifyOpener(url, keepOpen);
    }
}
