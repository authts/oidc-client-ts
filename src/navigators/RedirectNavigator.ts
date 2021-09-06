// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "../utils";
import { INavigator } from "./INavigator";
import { IWindow, NavigatorParams } from "./IWindow";

export class RedirectNavigator implements INavigator, IWindow {
    public prepare() {
        return Promise.resolve(this);
    }

    public navigate(params: NavigatorParams) {
        if (!params || !params.url) {
            Log.error("RedirectNavigator.navigate: No url provided");
            throw new Error("No url provided");
        }

        window.location[params.redirectMethod || "assign"](params.url);
        return Promise.resolve();
    }

    public get url() {
        return window.location.href;
    }

    public close() {
        Log.warn("Function not implemented");
    }
}
