// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "../utils";
import { IWindow } from "./IWindow";

const DefaultTimeout = 10000;

export class IFrameWindow implements IWindow {
    private _promise: Promise<unknown>;
    private _resolve!: (value: unknown) => void;
    private _reject!: (reason?: any) => void;
    private _boundMessageEvent: ((e: any) => void) | null;
    private _frame: HTMLIFrameElement | null;
    private _timer: number | null;

    constructor(_params: any) {
        this._promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });

        this._boundMessageEvent = this._message.bind(this);
        window.addEventListener("message", this._boundMessageEvent, false);

        this._frame = window.document.createElement("iframe");

        // shotgun approach
        this._frame.style.visibility = "hidden";
        this._frame.style.position = "absolute";
        this._frame.width = "0";
        this._frame.height = "0";

        window.document.body.appendChild(this._frame);

        this._timer = null;
    }

    navigate(params: any) {
        if (!params || !params.url) {
            this._error("No url provided");
        }
        else {
            const timeout = params.silentRequestTimeout || DefaultTimeout;
            Log.debug("IFrameWindow.navigate: Using timeout of:", timeout);
            this._timer = window.setTimeout(this._timeout.bind(this), timeout);
            this._frame!.src = params.url;
        }

        return this.promise;
    }

    get promise() {
        return this._promise;
    }

    _success(data: any) {
        this._cleanup();

        Log.debug("IFrameWindow: Successful response from frame window");
        this._resolve(data);
    }
    _error(message: string) {
        this._cleanup();

        Log.error(message);
        this._reject(new Error(message));
    }

    close() {
        this._cleanup();
    }

    _cleanup() {
        if (this._frame) {
            Log.debug("IFrameWindow: cleanup");

            window.removeEventListener("message", this._boundMessageEvent!, false);
            window.clearTimeout(this._timer!);
            window.document.body.removeChild(this._frame);

            this._timer = null;
            this._frame = null;
            this._boundMessageEvent = null;
        }
    }

    _timeout() {
        Log.debug("IFrameWindow.timeout");
        this._error("Frame window timed out");
    }

    _message(e: any) {
        Log.debug("IFrameWindow.message");

        if (this._timer && this._frame &&
            e.origin === this._origin &&
            e.source === this._frame.contentWindow &&
            (typeof e.data === "string" && (e.data.startsWith("http://") || e.data.startsWith("https://")))
        ) {
            const url = e.data;
            if (url) {
                this._success({ url: url });
            }
            else {
                this._error("Invalid response from frame");
            }
        }
    }

    get _origin() {
        return location.protocol + "//" + location.host;
    }

    static notifyParent(url: string | undefined) {
        Log.debug("IFrameWindow.notifyParent");
        url = url || window.location.href;
        if (url) {
            Log.debug("IFrameWindow.notifyParent: posting url message to parent");
            window.parent.postMessage(url, location.protocol + "//" + location.host);
        }
    }
}
