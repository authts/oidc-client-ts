// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "./utils";

/**
 * @public
 */
export class CheckSessionIFrame {
    private _frame_origin: string;
    private _frame: HTMLIFrameElement;
    private _timer: number | null = null
    private _session_state: string | null = null;

    public constructor(
        private _callback: () => Promise<void>,
        private _client_id: string,
        url: string,
        private _intervalInSeconds: number,
        private _stopOnError: boolean
    ) {
        const idx = url.indexOf("/", url.indexOf("//") + 2);
        this._frame_origin = url.substr(0, idx);

        this._frame = window.document.createElement("iframe");

        // shotgun approach
        this._frame.style.visibility = "hidden";
        this._frame.style.position = "fixed";
        this._frame.style.left = "-1000px";
        this._frame.style.top = "0";
        this._frame.width = "0";
        this._frame.height = "0";
        this._frame.src = url;
    }

    public load(): Promise<void> {
        return new Promise<void>((resolve) => {
            this._frame.onload = () => {
                resolve();
            };

            window.document.body.appendChild(this._frame);
            window.addEventListener("message", this._message, false);
        });
    }

    private _message = (e: MessageEvent<string>): void => {
        if (e.origin === this._frame_origin &&
            e.source === this._frame.contentWindow
        ) {
            if (e.data === "error") {
                Log.error("CheckSessionIFrame: error message from check session op iframe");
                if (this._stopOnError) {
                    this.stop();
                }
            }
            else if (e.data === "changed") {
                Log.debug("CheckSessionIFrame: changed message from check session op iframe");
                this.stop();
                void this._callback();
            }
            else {
                Log.debug("CheckSessionIFrame: " + e.data + " message from check session op iframe");
            }
        }
    }

    public start(session_state: string): void {
        if (this._session_state === session_state) {
            return;
        }

        Log.debug("CheckSessionIFrame.start");

        this.stop();

        this._session_state = session_state;

        const send = () => {
            if (!this._frame.contentWindow || !this._session_state) {
                return;
            }

            this._frame.contentWindow.postMessage(this._client_id + " " + this._session_state, this._frame_origin);
        };

        // trigger now
        send();

        // and setup timer
        this._timer = window.setInterval(send, this._intervalInSeconds * 1000);
    }

    public stop(): void {
        this._session_state = null;

        if (this._timer) {
            Log.debug("CheckSessionIFrame.stop");

            window.clearInterval(this._timer);
            this._timer = null;
        }
    }
}
