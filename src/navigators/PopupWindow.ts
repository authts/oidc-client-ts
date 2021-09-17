// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, UrlUtility } from "../utils";
import { IWindow, NavigatorParams } from "./IWindow";

const CheckForPopupClosedInterval = 500;
const DefaultPopupFeatures = "location=no,toolbar=no,width=500,height=500,left=100,top=100;";

const DefaultPopupTarget = "_blank";

export class PopupWindow implements IWindow {
    private _promise: Promise<unknown>;
    private _resolve!: (value: unknown) => void;
    private _reject!: (reason?: any) => void;
    private _popup: Window | null;
    private _checkForPopupClosedTimer: number | null;
    private _id: string | undefined;

    public constructor(params: NavigatorParams) {
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

    public navigate(params: NavigatorParams): Promise<any> {
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
            this._popup.window.location[params.redirectMethod || "assign"](params.url);
            window.addEventListener("message", this._messageReceived, false);
        }

        return this._promise;
    }

    _messageReceived(event: MessageEvent) {
        if (event.origin !== window.location.origin) {
            Log.warn('PopupWindow:messageRecieved: Message not coming from same origin: ' + event.origin);
            return;
        };

        let { data, url, keepOpen } = JSON.parse(event.data) as { data: Record<string, string>, url: string, keepOpen: boolean };

        if (data.state) {
            // @ts-ignore
            const callback = window["popupCallback_" + data.state];
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

    protected _success(data: any): void {
        Log.debug("PopupWindow.callback: Successful response from popup window");

        this._cleanup();
        this._resolve(data);
    }

    protected _error(message: string): void {
        Log.error("PopupWindow.error: ", message);

        this._cleanup();
        this._reject(new Error(message));
    }

    public close(): void {
        this._cleanup(false);
    }

    protected _cleanup(keepOpen?: boolean): void {
        Log.debug("PopupWindow.cleanup");

        window.clearInterval(this._checkForPopupClosedTimer!);
        this._checkForPopupClosedTimer = null;

        window.removeEventListener("message", this._messageReceived);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        delete window["popupCallback_" + this._id];

        if (this._popup && !keepOpen) {
            this._popup.close();
        }
        this._popup = null;
    }

    protected _checkForPopupClosed(): void {
        if (!this._popup || this._popup.closed) {
            this._error("Popup window closed");
        }
    }

    protected _callback(url: string, keepOpen: boolean): void {
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

    public static notifyOpener(url: string | undefined, keepOpen: boolean, delimiter: string): void {
        url = url || window.location.href;

        if (url) {
            const data = UrlUtility.parseUrlFragment(url, delimiter);
            window.opener?.postMessage(JSON.stringify({
                data,
                url,
                keepOpen,
            }), window.location.origin);
        }
    }
}
