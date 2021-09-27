// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "../utils";
import type { INavigator } from "./INavigator";
import type { IWindow, NavigateParams, NavigateResponse } from "./IWindow";

export class RedirectNavigator implements INavigator, IWindow {
    public prepare(): Promise<IWindow> {
        return Promise.resolve(this);
    }

    public navigate(params: NavigateParams): Promise<NavigateResponse> {
        if (!params || !params.url) {
            Log.error("RedirectNavigator.navigate: No url provided");
            throw new Error("No url provided");
        }

        window.location[params.redirectMethod || "assign"](params.url);
        return Promise.resolve(this);
    }

    public get url(): string {
        return window.location.href;
    }

    public close(): void {
        Log.warn("Function not implemented");
    }
}
