// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Event, Logger, UrlUtils } from "../utils";
import type { IWindow, NavigateParams, NavigateResponse } from "./IWindow";

const checkForPopupClosedInterval = 500;
const defaultPopupFeatures = "location=no,toolbar=no,width=500,height=500,left=100,top=100;";

const defaultPopupTarget = "_blank";

/**
 * @public
 */
export interface PopupWindowParams {
    popupWindowFeatures?: string;
    popupWindowTarget?: string;
}

/**
 * @internal
 */
export class PopupWindow implements IWindow {
    private readonly _logger = new Logger("PopupWindow");
    private readonly _close = new Event("Popup closed");
    private readonly _disposeHandlers = new Set<() => void>();

    private _popup: Window | null;
    private _state: string | undefined;

    public constructor({
        popupWindowTarget = defaultPopupTarget,
        popupWindowFeatures = defaultPopupFeatures
    }: PopupWindowParams) {
        this._popup = window.open("", popupWindowTarget, popupWindowFeatures);

        const popupClosedInterval = setInterval(() => {
            if (!this._popup || this._popup.closed) {
                this._close.raise();
                this._dispose();
            }
        }, checkForPopupClosedInterval);
        this._disposeHandlers.add(this._close.addHandler(() => clearInterval(popupClosedInterval)));
    }

    public async navigate(params: NavigateParams): Promise<NavigateResponse> {
        if (!this._popup || this._popup.closed) {
            throw new Error("Error opening popup window");
        }

        this._state = params.state;

        const promise = new Promise<{ data: Record<string, string>; url: string; keepOpen: boolean }>((resolve, reject) => {
            const listener = (e: MessageEvent) => {
                if (e.origin !== window.location.origin || e.data?.source !== "oidc-client") {
                    // silently discard events not intended for us
                    return;
                }
                if (e.source === this._popup || e.data.data.state === this._state) {
                    // MessageEvent source is a relatively modern feature, we can't rely on it
                    // so we also inspect the payload for a matching state key as an alternative
                    resolve(e.data);
                }
            };
            window.addEventListener("message", listener, false);
            this._disposeHandlers.add(() => window.removeEventListener("message", listener, false));
            this._disposeHandlers.add(this._close.addHandler(() => reject(new Error("Popup closed without a response"))));
        });

        this._logger.debug("navigate: Setting URL in popup");
        this._popup.focus();
        this._popup.location.replace(params.url);

        const { data, url, keepOpen } = await promise;
        if (keepOpen) {
            this._dispose();
        } else {
            this.close();
        }

        this._logger.debug("navigate: Got response from popup window");
        if (!data.state) this._logger.warn("navigate: no state found in response url");

        if (!url) {
            throw new Error("Invalid response from popup");
        }

        return { url };
    }

    public close(): void {
        if (this._popup && !this._popup.closed) {
            this._popup.close();
            this._close.raise();
        }
        this._dispose();
    }

    protected _dispose(): void {
        this._logger.debug("_dispose");

        for (const dispose of this._disposeHandlers) {
            dispose();
        }
        this._disposeHandlers.clear();
        this._state = undefined;
        if (this._popup && this._popup.closed) {
            this._popup = null;
        }
    }

    public static notifyOpener(url: string, delimiter: string, keepOpen: boolean): void {
        if (!window.opener) {
            throw new Error("No window.opener. Can't complete notification.");
        }
        const data = UrlUtils.parseUrlFragment(url, delimiter);
        window.opener.postMessage({
            source: "oidc-client",
            data,
            url,
            keepOpen,
        }, window.location.origin);
    }
}
