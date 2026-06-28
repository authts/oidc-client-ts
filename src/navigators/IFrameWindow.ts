// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "../utils";
import { ErrorResponse, ErrorTimeout } from "../errors";
import type { NavigateParams, NavigateResponse } from "./IWindow";
import { AbstractChildWindow } from "./AbstractChildWindow";
import { DefaultIFrameAttributes, DefaultSilentRequestTimeoutInSeconds } from "../UserManagerSettings";

/**
 * @public
 */
export interface IFrameWindowParams {
    silentRequestTimeoutInSeconds?: number;
    iframeAttributes?: Record<string, string>;
}

/**
 * @internal
 */
export class IFrameWindow extends AbstractChildWindow {
    protected readonly _logger = new Logger("IFrameWindow");
    private _frame: HTMLIFrameElement | null;
    private _timeoutInSeconds: number;

    public constructor({
        silentRequestTimeoutInSeconds = DefaultSilentRequestTimeoutInSeconds,
        iframeAttributes = DefaultIFrameAttributes,
    }: IFrameWindowParams) {
        super();
        this._timeoutInSeconds = silentRequestTimeoutInSeconds;

        this._frame = IFrameWindow.createHiddenIframe(iframeAttributes);
        this._window = this._frame.contentWindow;
    }

    private static createHiddenIframe(iframeAttributes: Record<string, string> | undefined): HTMLIFrameElement {
        const iframe = window.document.createElement("iframe");

        // shotgun approach
        iframe.style.visibility = "hidden";
        iframe.style.position = "fixed";
        iframe.style.left = "-1000px";
        iframe.style.top = "0";
        iframe.width = "0";
        iframe.height = "0";

        if (iframeAttributes) {
            for (const attr in iframeAttributes) {
                iframe.setAttribute(attr, iframeAttributes[attr]);
            }
        }

        window.document.body.appendChild(iframe);
        return iframe;
    }

    public async navigate(params: NavigateParams): Promise<NavigateResponse> {
        this._logger.debug("navigate: Using timeout of:", this._timeoutInSeconds);
        const timer = setTimeout(() => void this._abort.raise(new ErrorTimeout("IFrame timed out without a response")), this._timeoutInSeconds * 1000);
        this._disposeHandlers.add(() => clearTimeout(timer));
        // Detect error in iframe URL immediately after load to avoid waiting for timeout
        const frame = this._frame!;
        const iframeLoadHandler = () => {
            try {
                if (!frame?.contentWindow) {
                    return;
                }
                const url = frame.contentWindow.location.href;
                const urlParams = new URL(url, window.location.origin);
                const error = urlParams.searchParams.get("error");
                if (error) {
                    clearTimeout(timer);
                    this._logger.debug("Detected error in iframe URL:", error);
                    const errorDescription = urlParams.searchParams.get("error_description") || `${error}`;
                    void this._abort.raise(new ErrorResponse({ error, error_description: errorDescription }));
                }
            } catch {
                // Cross-origin access - can't read URL, ignore
            }
        };
        frame.addEventListener("load", iframeLoadHandler);
        this._disposeHandlers.add(() => frame?.removeEventListener("load", iframeLoadHandler));

        return await super.navigate(params);
    }

    public close(): void {
        if (this._frame) {
            if (this._frame.parentNode) {
                this._frame.addEventListener("load", (ev) => {
                    const frame = ev.target as HTMLIFrameElement;
                    frame.parentNode?.removeChild(frame);
                    void this._abort.raise(new Error("IFrame removed from DOM"));
                }, true);
                this._frame.contentWindow?.location.replace("about:blank");
            }
            this._frame = null;
        }
        this._window = null;
    }

    public static notifyParent(url: string, targetOrigin?: string): void {
        return super._notifyParent(window.parent, url, false, targetOrigin);
    }
}
