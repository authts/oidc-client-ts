// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "../utils";
import type { IWindow, NavigateParams, NavigateResponse } from "./IWindow";

const defaultTimeoutInSeconds = 10;

/**
 * @public
 */
export interface IFrameWindowParams {
    silentRequestTimeoutInSeconds?: number;
}

/**
 * @internal
 */
export class IFrameWindow implements IWindow {
    private readonly _logger: Logger;

    private _resolve!: (value: NavigateResponse) => void;
    private _reject!: (reason?: any) => void;
    private _promise = new Promise<NavigateResponse>((resolve, reject) => {
        this._resolve = resolve;
        this._reject = reject;
    })
    private _timeoutInSeconds: number;
    private _frame: HTMLIFrameElement | null;
    private _timer: number | null = null;

    public constructor({
        silentRequestTimeoutInSeconds = defaultTimeoutInSeconds
    }: IFrameWindowParams) {
        this._logger = new Logger("IFrameWindow");

        this._timeoutInSeconds = silentRequestTimeoutInSeconds;
        window.addEventListener("message", this._message, false);

        this._frame = window.document.createElement("iframe");

        // shotgun approach
        this._frame.style.visibility = "hidden";
        this._frame.style.position = "fixed";
        this._frame.style.left = "-1000px";
        this._frame.style.top = "0";
        this._frame.width = "0";
        this._frame.height = "0";

        window.document.body.appendChild(this._frame);
    }

    public async navigate(params: NavigateParams): Promise<NavigateResponse> {
        if (!params || !params.url) {
            this._error("No url provided");
        }
        else if (!this._frame) {
            this._error("No _frame, already closed");
        }
        else {
            this._logger.debug("navigate: Using timeout of:", this._timeoutInSeconds);
            this._timer = window.setTimeout(this._timeout, this._timeoutInSeconds * 1000);
            this._frame.src = params.url;
        }

        return await this._promise;
    }

    protected _success(data: NavigateResponse): void {
        this._cleanup();

        this._logger.debug("Successful response from frame window");
        this._resolve(data);
    }
    protected _error(message: string): void {
        this._cleanup();

        this._logger.error(message);
        this._reject(new Error(message));
    }

    close(): void {
        this._cleanup();
    }

    protected _cleanup(): void {
        this._logger.debug("_cleanup");
        if (this._timer != null) {
            window.clearTimeout(this._timer);
        }
        if (this._frame) {
            window.removeEventListener("message", this._message, false);
            window.document.body.removeChild(this._frame);
        }

        this._timer = null;
        this._frame = null;
    }

    protected _timeout = (): void => {
        this._logger.debug("_timeout");
        this._error("Frame window timed out");
    }

    protected _message = (e: MessageEvent): void => {
        this._logger.debug("_message");

        const origin = location.protocol + "//" + location.host;
        if (this._timer && this._frame &&
            e.origin === origin &&
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

    public static notifyParent(url: string | undefined): void {
        Logger.debug("IFrameWindow", "notifyParent");
        url = url || window.location.href;
        if (url) {
            Logger.debug("IFrameWindow", "notifyParent: posting url message to parent");
            window.parent.postMessage(url, location.protocol + "//" + location.host);
        }
    }
}
