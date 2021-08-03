// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from '../utils';
import { PopupWindow } from './PopupWindow';
import { INavigator } from './INavigator';

export class PopupNavigator implements INavigator {

    prepare(params: any) {
        let popup = new PopupWindow(params);
        return Promise.resolve(popup);
    }

    callback(url: string | undefined, keepOpen: boolean, delimiter: string) {
        Log.debug("PopupNavigator.callback");

        try {
            PopupWindow.notifyOpener(url, keepOpen, delimiter);
            return Promise.resolve();
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
}
