// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, PopupUtils, PopupWindowFeatures } from "../utils";
import { AbstractChildWindow } from "./AbstractChildWindow";
import type { NavigateParams, NavigateResponse } from "./IWindow";

const checkForPopupClosedInterval = 500;
const defaultPopupWindowFeatures: PopupWindowFeatures = {
    location: false,
    toolbar: false,
    height: 640,
};

const defaultPopupTarget = "_blank";

/**
 * @public
 */
export interface PopupWindowParams {
    popupWindowFeatures?: PopupWindowFeatures;
    popupWindowTarget?: string;
}

/**
 * @internal
 */
export class PopupWindow extends AbstractChildWindow {
    protected readonly _logger = new Logger("PopupWindow");

    protected _window: WindowProxy | null;

    public constructor({
        popupWindowTarget = defaultPopupTarget,
        popupWindowFeatures = {},
    }: PopupWindowParams) {
        super();
        const centeredPopup = PopupUtils.center({ ...defaultPopupWindowFeatures, ...popupWindowFeatures });
        this._window = window.open(undefined, popupWindowTarget, PopupUtils.serialize(centeredPopup));
    }

    public async navigate(params: NavigateParams): Promise<NavigateResponse> {
        this._window?.focus();

        const popupClosedInterval = setInterval(() => {
            if (!this._window || this._window.closed) {
                this._abort.raise(new Error("Popup closed by user"));
            }
        }, checkForPopupClosedInterval);
        this._disposeHandlers.add(() => clearInterval(popupClosedInterval));

        return await super.navigate(params);
    }

    public close(): void {
        if (this._window) {
            if (!this._window.closed) {
                this._window.close();
            }
            this._abort.raise(new Error("Popup closed"));
        }
        this._window = null;
    }

    public static notifyOpener(url: string, keepOpen: boolean): void {
        if (!window.opener) {
            throw new Error("No window.opener. Can't complete notification.");
        }
        return super._notifyParent(window.opener, url, keepOpen);
    }
}
