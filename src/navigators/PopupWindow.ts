// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, UrlUtility } from "../utils";
import { IWindow } from "./IWindow";

const CheckForPopupClosedInterval = 500;
const DefaultPopupFeatures = "location=no,toolbar=no,width=500,height=500,left=100,top=100;";
//const DefaultPopupFeatures = 'location=no,toolbar=no,width=500,height=500,left=100,top=100;resizable=yes';

const DefaultPopupTarget = "_blank";

export class PopupWindow implements IWindow {
    private _promise: Promise<unknown>;
    private _resolve!: (value: unknown) => void;
    private _reject!: (reason?: any) => void;
    private _popup: Window | null;
    private _checkForPopupClosedTimer: number | null;
    private _id: any;

    constructor(params: any) {
        this._promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });

        const target = params.popupWindowTarget || DefaultPopupTarget;
        const features = params.popupWindowFeatures || DefaultPopupFeatures;

        this._popup = window.open("", target, features);
        this._checkForPopupClosedTimer = null;
        if (this._popup) {
            Log.debug("PopupWindow.ctor: popup successfully created");
            this._checkForPopupClosedTimer = window.setInterval(this._checkForPopupClosed.bind(this), CheckForPopupClosedInterval);
        }
    }

    navigate(params: any) {
        if (!this._popup) {
            this._error("PopupWindow.navigate: Error opening popup window");
        }
        else if (!params || !params.url) {
            this._error("PopupWindow.navigate: no url provided");
            this._error("No url provided");
        }
        else {
            Log.debug("PopupWindow.navigate: Setting URL in popup");

            this._id = params.id;
            if (this._id) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                window["popupCallback_" + params.id] = this._callback.bind(this);
            }

            this._popup.focus();
            this._popup.window.location = params.url;
        }

        return this._promise;
    }

    _success(data: any) {
        Log.debug("PopupWindow.callback: Successful response from popup window");

        this._cleanup();
        this._resolve(data);
    }
    _error(message: string) {
        Log.error("PopupWindow.error: ", message);

        this._cleanup();
        this._reject(new Error(message));
    }

    close() {
        this._cleanup(false);
    }

    _cleanup(keepOpen?: boolean) {
        Log.debug("PopupWindow.cleanup");

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        window.clearInterval(this._checkForPopupClosedTimer!);
        this._checkForPopupClosedTimer = null;

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        delete window["popupCallback_" + this._id];

        if (this._popup && !keepOpen) {
            this._popup.close();
        }
        this._popup = null;
    }

    _checkForPopupClosed() {
        if (!this._popup || this._popup.closed) {
            this._error("Popup window closed");
        }
    }

    _callback(url: string, keepOpen: boolean) {
        this._cleanup(keepOpen);

        if (url) {
            Log.debug("PopupWindow.callback success");
            this._success({ url: url });
        }
        else {
            Log.debug("PopupWindow.callback: Invalid response from popup");
            this._error("Invalid response from popup");
        }
    }

    static notifyOpener(url: string | undefined, keepOpen: boolean, delimiter: string) {
        if (window.opener) {
            url = url || window.location.href;
            if (url) {
                const data = UrlUtility.parseUrlFragment(url, delimiter);

                if (data.state) {
                    const name = "popupCallback_" + data.state;
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    const callback = window.opener[name];
                    if (callback) {
                        Log.debug("PopupWindow.notifyOpener: passing url message to opener");
                        callback(url, keepOpen);
                    }
                    else {
                        Log.warn("PopupWindow.notifyOpener: no matching callback found on opener");
                    }
                }
                else {
                    Log.warn("PopupWindow.notifyOpener: no state found in response url");
                }
            }
        }
        else {
            Log.warn("PopupWindow.notifyOpener: no window.opener. Can't complete notification.");
        }
    }
}
