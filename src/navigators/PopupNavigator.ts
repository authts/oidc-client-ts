// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "../utils";
import { PopupWindow, PopupWindowParams } from "./PopupWindow";
import type { INavigator } from "./INavigator";
import type { UserManagerSettingsStore } from "../UserManagerSettings";

/**
 * @internal
 */
export class PopupNavigator implements INavigator {
    private readonly _logger: Logger;

    constructor(private _settings: UserManagerSettingsStore) {
        this._logger = new Logger("PopupNavigator");
    }

    public async prepare({
        popupWindowFeatures = this._settings.popupWindowFeatures,
        popupWindowTarget = this._settings.popupWindowTarget,
    }: PopupWindowParams): Promise<PopupWindow> {
        return new PopupWindow({ popupWindowFeatures, popupWindowTarget });
    }

    public async callback(url: string | undefined, keepOpen: boolean, delimiter: string): Promise<void> {
        this._logger.debug("callback");

        PopupWindow.notifyOpener(url, keepOpen, delimiter);
    }
}
