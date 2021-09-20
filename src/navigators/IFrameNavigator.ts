// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "../utils";
import { IFrameWindow } from "./IFrameWindow";
import type { INavigator } from "./INavigator";
import type { IWindow } from "./IWindow";

export class IFrameNavigator implements INavigator {
    public prepare(): Promise<IWindow> {
        const frame = new IFrameWindow();
        return Promise.resolve(frame);
    }

    public callback(url: string | undefined): Promise<void> {
        Log.debug("IFrameNavigator.callback");
        try {
            IFrameWindow.notifyParent(url);
            return Promise.resolve();
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
}
