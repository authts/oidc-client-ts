// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Event, Logger, UrlUtils } from "../utils";
import type { IWindow, NavigateParams, NavigateResponse } from "./IWindow";

const messageSource = "oidc-client";

interface MessageData {
    source: string;
    url: string;
    keepOpen: boolean;
}

/**
 * Window implementation which resolves via communication from a child window
 * via the `Window.postMessage()` interface.
 *
 * @internal
 */
export abstract class AbstractChildWindow implements IWindow {
    protected abstract readonly _logger: Logger;
    protected readonly _abort = new Event<[reason: Error]>("Window navigation aborted");
    protected readonly _disposeHandlers = new Set<() => void>();

    protected _window: WindowProxy | null = null;

    public async navigate(params: NavigateParams): Promise<NavigateResponse> {
        if (!this._window) {
            throw new Error("Attempted to navigate on a disposed window");
        }

        this._logger.debug("navigate: Setting URL in window");
        this._window.location.replace(params.url);

        const { url, keepOpen } = await new Promise<MessageData>((resolve, reject) => {
            const listener = (e: MessageEvent) => {
                const data: MessageData | undefined = e.data;
                if (e.origin !== window.location.origin || data?.source !== messageSource) {
                    // silently discard events not intended for us
                    return;
                }
                try {
                    const state = UrlUtils.readParams(data.url, params.response_mode).get("state");
                    if (!state) {
                        this._logger.warn("navigate: no state found in response url");
                    }
                    if (e.source !== this._window && state !== params.state) {
                        // MessageEvent source is a relatively modern feature, we can't rely on it
                        // so we also inspect the payload for a matching state key as an alternative
                        return;
                    }
                }
                catch (err) {
                    this._dispose();
                    reject(new Error("Invalid response from window"));
                }
                resolve(data);
            };
            window.addEventListener("message", listener, false);
            this._disposeHandlers.add(() => window.removeEventListener("message", listener, false));
            this._disposeHandlers.add(this._abort.addHandler((reason) => {
                this._dispose();
                reject(reason);
            }));
        });
        this._logger.debug("navigate: Got response from window");
        this._dispose();

        if (!keepOpen) {
            this.close();
        }

        return { url };
    }

    public abstract close(): void;

    private _dispose(): void {
        this._logger.debug("_dispose");

        for (const dispose of this._disposeHandlers) {
            dispose();
        }
        this._disposeHandlers.clear();
    }

    protected static _notifyParent(parent: Window, url: string, keepOpen = false): void {
        parent.postMessage({
            source: messageSource,
            url,
            keepOpen,
        } as MessageData, window.location.origin);
    }
}
