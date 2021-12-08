// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "../utils";
import type { NavigateParams, NavigateResponse } from "./IWindow";
import { AbstractChildWindow } from "./AbstractChildWindow";

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
export class IFrameWindow extends AbstractChildWindow {
    protected readonly _logger = new Logger("IFrameWindow");
    private _frame: HTMLIFrameElement | null;
    private _timeoutInSeconds: number;

    public constructor({
        silentRequestTimeoutInSeconds = defaultTimeoutInSeconds,
    }: IFrameWindowParams) {
        super();
        this._timeoutInSeconds = silentRequestTimeoutInSeconds;

        this._frame = window.document.createElement("iframe");
        this._window = this._frame.contentWindow;

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
        this._logger.debug("navigate: Using timeout of:", this._timeoutInSeconds);
        const timer = setTimeout(() => this._abort.raise(new Error("IFrame timed out without a response")), this._timeoutInSeconds * 1000);
        this._disposeHandlers.add(() => clearTimeout(timer));

        return await super.navigate(params);
    }

    close(): void {
        if (this._frame) {
            if (this._frame.parentNode) {
                this._frame.parentNode.removeChild(this._frame);
            }
            this._abort.raise(new Error("IFrame removed from DOM"));
            this._frame = null;
        }
        this._window = null;
    }

    public static notifyParent(url: string): void {
        return super._notifyParent(window.parent, url);
    }
}
