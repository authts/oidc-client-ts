// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Event, Logger, UrlUtils } from "../utils";
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
    private readonly _logger = new Logger("IFrameWindow");
    private readonly _timeout = new Event("IFrame timed out");
    private readonly _disposeHandlers = new Set<() => void>();

    private _timeoutInSeconds: number;
    private _frame: HTMLIFrameElement | null;
    private _state: string | undefined;

    public constructor({
        silentRequestTimeoutInSeconds = defaultTimeoutInSeconds
    }: IFrameWindowParams) {
        this._timeoutInSeconds = silentRequestTimeoutInSeconds;

        this._frame = window.document.createElement("iframe");

        // shotgun approach
        this._frame.style.visibility = "hidden";
        this._frame.style.position = "fixed";
        this._frame.style.left = "-1000px";
        this._frame.style.top = "0";
        this._frame.width = "0";
        this._frame.height = "0";

        window.document.body.appendChild(this._frame);
        this._window = this._frame.contentWindow;
    }

    public async navigate(params: NavigateParams): Promise<NavigateResponse> {
        if (!this._frame) {
            throw new Error("Error creating IFrame");
        }

        this._state = params.state;

        const promise = new Promise<{ data: Record<string, string>; url: string }>((resolve, reject) => {
            const listener = (e: MessageEvent) => {
                if (e.origin !== window.location.origin || e.data?.source !== "oidc-client") {
                    // silently discard events not intended for us
                    return;
                }
                if (e.source === this._frame || e.data.data.state === this._state) {
                    // MessageEvent source is a relatively modern feature, we can't rely on it
                    // so we also inspect the payload for a matching state key as an alternative
                    resolve(e.data);
                }
            };
            window.addEventListener("message", listener, false);
            this._disposeHandlers.add(() => window.removeEventListener("message", listener, false));
            this._disposeHandlers.add(this._timeout.addHandler(() => reject(new Error("IFrame timed out without a response"))));
        });

        this._logger.debug("navigate: Using timeout of:", this._timeoutInSeconds);

        const timer = window.setTimeout(() => this._timeout.raise(), this._timeoutInSeconds * 1000);
        this._disposeHandlers.add(() => clearTimeout(timer));

        this._logger.debug("navigate: Setting URL in IFrame");
        this._frame.src = params.url;

        const { data, url } = await promise;
        this.close();

        this._logger.debug("navigate: Got response from IFrame window");

        if (!data.state) this._logger.warn("navigate: no state found in response url");

        if (!url) {
            throw new Error("Invalid response from IFrame");
        }

        return { url };
    }

    close(): void {
        if (this._frame?.parentNode) {
            this._frame.parentNode.removeChild(this._frame);
        }
        this._dispose();
    }

    protected _dispose(): void {
        this._logger.debug("_dispose");

        for (const dispose of this._disposeHandlers) {
            dispose();
        }
        this._disposeHandlers.clear();
        if (this._frame && !this._frame.parentNode) {
            this._frame = null;
        }

        this._frame = null;
    }

    public static notifyParent(url: string, delimiter: string): void {
        Logger.debug("IFrameWindow", "notifyParent: posting url message to parent");
        const data = UrlUtils.parseUrlFragment(url, delimiter);
        window.parent.postMessage({
            source: "oidc-client",
            data,
            url
        }, window.location.origin);
    }
}
