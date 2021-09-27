// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "../utils";
import { IFrameWindow, IFrameWindowParams } from "./IFrameWindow";
import type { INavigator } from "./INavigator";

export class IFrameNavigator implements INavigator {
    public async prepare(params: IFrameWindowParams): Promise<IFrameWindow> {
        return new IFrameWindow(params);
    }

    public async callback(url: string | undefined): Promise<void> {
        Log.debug("IFrameNavigator.callback");
        IFrameWindow.notifyParent(url);
    }
}
