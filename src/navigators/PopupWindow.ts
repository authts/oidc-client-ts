// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, UrlUtils } from "../utils";
import type { IWindow, NavigateParams, NavigateResponse } from "./IWindow";

const checkForPopupClosedInterval = 500;
const defaultPopupFeatures = "location=no,toolbar=no,width=500,height=500,left=100,top=100;";

const defaultPopupTarget = "_blank";

export interface PopupWindowParams {
    popupWindowFeatures?: string;
    popupWindowTarget?: string;
}

export class PopupWindow implements IWindow {
    private _resolve!: (value: NavigateResponse) => void;
    private _reject!: (reason?: any) => void;
    private _promise = new Promise<NavigateResponse>((resolve, reject) => {
        this._resolve = resolve;
        this._reject = reject;
    });
    private _popup: Window | null;
    private _checkForPopupClosedTimer: number | null = null
    private _id: string | undefined;

    public constructor({
        popupWindowTarget = defaultPopupTarget,
        popupWindowFeatures = defaultPopupFeatures
    }: PopupWindowParams) {
        this._popup = window.open("", popupWindowTarget, popupWindowFeatures);
        if (this._popup) {
            Log.debug("PopupWindow.ctor: popup successfully created");
            this._checkForPopupClosedTimer = window.setInterval(this._checkForPopupClosed, checkForPopupClosedInterval);
        }
    }

    public async navigate(params: NavigateParams): Promise<NavigateResponse> {
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
                (window as any)["popupCallback_" + this._id] = this._callback;
            }

            this._popup.focus();
            this._popup.window.location.replace(params.url);
            window.addEventListener("message", this._messageReceived, false);
        }

        return await this._promise;
    }

    protected _messageReceived = (event: MessageEvent): void => {
        if (event.origin !== window.location.origin) {
            Log.warn("PopupWindow:_messageReceived: Message not coming from same origin: " + event.origin);
            return;
        }

        const { data, url, keepOpen } = JSON.parse(event.data) as { data: Record<string, string>; url: string; keepOpen: boolean };

        if (data.state) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const callback = window["popupCallback_" + data.state];
            if (callback) {
                Log.debug("PopupWindow._messageReceived: passing url message to opener");
                callback(url, keepOpen);
            }
            else {
                Log.warn("PopupWindow._messageReceived: no matching callback found on opener");
            }
        }
        else {
            Log.warn("PopupWindow._messageReceived: no state found in response url");
        }
    }

    protected _success(data: NavigateResponse): void {
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

        if (this._checkForPopupClosedTimer) {
            window.clearInterval(this._checkForPopupClosedTimer);
            this._checkForPopupClosedTimer = null;
        }

        window.removeEventListener("message", this._messageReceived);

        if (this._id) {
            delete (window as any)["popupCallback_" + this._id];
        }
        this._id = undefined;

        if (this._popup && !keepOpen) {
            this._popup.close();
        }
        this._popup = null;
    }

    protected _checkForPopupClosed = (): void => {
        if (!this._popup || this._popup.closed) {
            this._error("Popup window closed");
        }
    }

    protected _callback = (url: string, keepOpen: boolean): void => {
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
        if (window.opener) {
            url = url || window.location.href;

            if (url) {
                const data = UrlUtils.parseUrlFragment(url, delimiter);
                window.opener?.postMessage(JSON.stringify({
                    data,
                    url,
                    keepOpen,
                }), window.location.origin);
            }
        }
        else {
            Log.warn("PopupWindow.notifyOpener: no window.opener. Can't complete notification.");
        }
    }
}
