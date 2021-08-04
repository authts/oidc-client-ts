// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "./utils";

const DefaultInterval = 2000;

export class CheckSessionIFrame {
    private _callback: () => void;
    private _client_id: string;
    private _interval: number;
    private _stopOnError: boolean;
    private _frame_origin: string;
    private _frame: HTMLIFrameElement;
    private _boundMessageEvent: ((e: any) => void) | null;
    private _timer: number | null;
    private _session_state: any | null;

    constructor(callback: () => void, client_id: string, url: string, interval?: number, stopOnError?: boolean) {
        this._callback = callback;
        this._client_id = client_id;
        this._interval = interval || DefaultInterval;
        this._stopOnError = stopOnError || true;

        const idx = url.indexOf("/", url.indexOf("//") + 2);
        this._frame_origin = url.substr(0, idx);

        this._frame = window.document.createElement("iframe");

        // shotgun approach
        this._frame.style.visibility = "hidden";
        this._frame.style.position = "absolute";
        this._frame.style.display = "none";
        this._frame.width = "0";
        this._frame.height = "0";
        this._frame.src = url;

        this._boundMessageEvent = null;
        this._timer = null;

    }

    load() {
        return new Promise<void>((resolve) => {
            this._frame.onload = () => {
                resolve();
            };

            window.document.body.appendChild(this._frame);
            this._boundMessageEvent = this._message.bind(this);
            window.addEventListener("message", this._boundMessageEvent, false);
        });
    }

    _message(e: any) {
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
                this._callback();
            }
            else {
                Log.debug("CheckSessionIFrame: " + e.data + " message from check session op iframe");
            }
        }
    }

    start(session_state: any) {
        if (this._session_state !== session_state) {
            Log.debug("CheckSessionIFrame.start");

            this.stop();

            this._session_state = session_state;

            const send = () => {
                this._frame.contentWindow &&
                this._frame.contentWindow.postMessage(this._client_id + " " + this._session_state, this._frame_origin);
            };

            // trigger now
            send();

            // and setup timer
            this._timer = window.setInterval(send, this._interval);
        }
    }

    stop() {
        this._session_state = null;

        if (this._timer) {
            Log.debug("CheckSessionIFrame.stop");

            window.clearInterval(this._timer);
            this._timer = null;
        }
    }
}
