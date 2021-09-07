// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "../utils";
import { IFrameWindow } from "./IFrameWindow";
import { INavigator } from "./INavigator";

export class IFrameNavigator implements INavigator {
    public prepare() {
        const frame = new IFrameWindow();
        return Promise.resolve(frame);
    }

    public callback(url: string | undefined) {
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
