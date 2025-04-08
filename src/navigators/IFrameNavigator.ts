// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "../utils";
import type { UserManagerSettingsStore } from "../UserManagerSettings";
import { IFrameWindow, type IFrameWindowParams } from "./IFrameWindow";
import type { INavigator } from "./INavigator";

/**
 * @internal
 */
export class IFrameNavigator implements INavigator {
    private readonly _logger = new Logger("IFrameNavigator");

    constructor(private _settings: UserManagerSettingsStore) {}

    public async prepare({
        silentRequestTimeoutInSeconds = this._settings.silentRequestTimeoutInSeconds,
    }: IFrameWindowParams): Promise<IFrameWindow> {
        return new IFrameWindow({ silentRequestTimeoutInSeconds });
    }

    public async callback(url: string): Promise<void> {
        this._logger.create("callback");
        IFrameWindow.notifyParent(url, this._settings.iframeNotifyParentOrigin);
    }
}
