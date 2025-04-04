// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, PopupUtils, type PopupWindowFeatures } from "../utils";
import { DefaultPopupWindowFeatures, DefaultPopupTarget } from "../UserManagerSettings";
import { AbstractChildWindow } from "./AbstractChildWindow";
import type { NavigateParams, NavigateResponse } from "./IWindow";

const checkForPopupClosedInterval = 500;
const second = 1000;

/**
 * @public
 */
export interface PopupWindowParams {
    popupWindowFeatures?: PopupWindowFeatures;
    popupWindowTarget?: string;
    /** An AbortSignal to set request's signal. */
    popupSignal?: AbortSignal | null;
}

/**
 * @internal
 */
export class PopupWindow extends AbstractChildWindow {
    protected readonly _logger = new Logger("PopupWindow");

    protected _window: WindowProxy | null;

    public constructor({
        popupWindowTarget = DefaultPopupTarget,
        popupWindowFeatures = {},
        popupSignal,
    }: PopupWindowParams) {
        super();
        const centeredPopup = PopupUtils.center({ ...DefaultPopupWindowFeatures, ...popupWindowFeatures });
        this._window = window.open(undefined, popupWindowTarget, PopupUtils.serialize(centeredPopup));

        if (popupSignal) {
            popupSignal.addEventListener("abort", () => {
                void this._abort.raise(new Error(popupSignal.reason ?? "Popup aborted"));
            });
        }

        if (popupWindowFeatures.closePopupWindowAfterInSeconds && popupWindowFeatures.closePopupWindowAfterInSeconds > 0) {
            setTimeout(() => {
                if (!this._window || typeof this._window.closed !== "boolean" || this._window.closed) {
                    void this._abort.raise(new Error("Popup blocked by user"));
                    return;
                }

                this.close();
            }, popupWindowFeatures.closePopupWindowAfterInSeconds * second);
        }
    }

    public async navigate(params: NavigateParams): Promise<NavigateResponse> {
        this._window?.focus();

        const popupClosedInterval = setInterval(() => {
            if (!this._window || this._window.closed) {
                this._logger.debug("Popup closed by user or isolated by redirect");
            }
        }, checkForPopupClosedInterval);
        this._disposeHandlers.add(() => clearInterval(popupClosedInterval));

        return await super.navigate(params);
    }

    public close(): void {
        if (this._window) {
            if (!this._window.closed) {
                this._window.close();
                void this._abort.raise(new Error("Popup closed"));
            }
        }
        this._window = null;
    }

    public static notifyOpener(url: string, keepOpen: boolean): void {
        if (!window.opener) {
            const logger = new Logger("PopupWindow");
            logger.debug("No window.opener. Using BroadcastChannel.");
            const state = new URL(url).searchParams.get("state");
            if (!state) {
                throw new Error("No window.opener and no state in URL. Can't complete notification.");
            }
            const channel = new BroadcastChannel(`oidc-client-popup-${state}`);
            super._notifyParent(channel, url, keepOpen);
            channel.close();
            window.close();
            return;
        }
        super._notifyParent(window.opener, url, keepOpen);
    }
}
