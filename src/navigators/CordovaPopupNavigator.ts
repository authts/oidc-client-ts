// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { CordovaPopupWindow } from "./CordovaPopupWindow";
import { INavigator } from "./INavigator";
import { NavigatorParams } from "./IWindow";

export class CordovaPopupNavigator implements INavigator {
    public prepare(params: NavigatorParams) {
        const popup = new CordovaPopupWindow(params);
        return Promise.resolve(popup);
    }
}
