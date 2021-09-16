// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "./utils";

export type JwtHandler = (text: string) => Promise<any>;

export class JsonService {
    private _contentTypes: string[];
    private _jwtHandler: JwtHandler | null;

    public constructor(
        additionalContentTypes: string[] = [],
        jwtHandler: JwtHandler | null = null
    ) {
        this._contentTypes = additionalContentTypes.slice();
        this._contentTypes.push("application/json");
        if (jwtHandler) {
            this._contentTypes.push("application/jwt");
        }

        this._jwtHandler = jwtHandler;
    }

    public async getJson(url: string, token?: string): Promise<any> {
        if (!url) {
            Log.error("JsonService.getJson: No url passed");
            throw new Error("url");
        }

        const headers: HeadersInit = {};
        if (token) {
            Log.debug("JsonService.getJson: token passed, setting Authorization header");
            headers["Authorization"] = "Bearer " + token;
        }

        let response: Response;
        try {
            Log.debug("JsonService.getJson, url: ", url);
            response = await fetch(url, { method: "GET", headers });
        }
        catch (err) {
            Log.error("JsonService.getJson: network error");
            throw new Error("Network Error");
        }

        Log.debug("JsonService.getJson: HTTP response received, status", response.status);
        if (response.status === 200) {
            const contentType = response.headers.get("Content-Type");
            if (contentType) {
                const found = this._contentTypes.find(item => contentType.startsWith(item));
                if (found === "application/jwt" && this._jwtHandler) {
                    const text = await response.text();
                    return await this._jwtHandler(text);
                }

                if (found) {
                    try {
                        const json = await response.json();
                        return json;
                    }
                    catch (err) {
                        Log.error("JsonService.getJson: Error parsing JSON response", err instanceof Error ? err.message : err);
                        throw err;
                    }
                }
            }

            throw new Error("Invalid response Content-Type: " + (contentType ?? "undefined") + ", from URL: " + url);
        }

        throw new Error(response.statusText + " (" + response.status.toString() + ")");
    }

    public async postForm(url: string, payload: any, basicAuth?: string): Promise<any> {
        if (!url) {
            Log.error("JsonService.postForm: No url passed");
            throw new Error("url");
        }

        const headers: HeadersInit = {
            "Content-Type": "application/x-www-form-urlencoded",
        };
        if (basicAuth !== undefined) {
            headers["Authorization"] = "Basic " + btoa(basicAuth);
        }

        const body = new URLSearchParams();
        for (const key in payload) {
            const value = payload[key];

            if (value) {
                body.set(key, value);
            }
        }

        let response: Response;
        try {
            Log.debug("JsonService.postForm, url: ", url);
            response = await fetch(url, { method: "POST", headers, body });
        }
        catch (err) {
            Log.error("JsonService.postForm: network error");
            throw new Error("Network Error");
        }

        const allowedContentTypes = this._contentTypes;

        Log.debug("JsonService.postForm: HTTP response received, status", response.status);
        if (response.status === 200) {
            const contentType = response.headers.get("Content-Type");
            if (contentType) {
                const found = allowedContentTypes.find(item => contentType.startsWith(item));
                if (found) {
                    try {
                        const json = await response.json();
                        return json;
                    }
                    catch (err) {
                        Log.error("JsonService.postForm: Error parsing JSON response", err instanceof Error ? err.message : err);
                        throw err;
                    }
                }
            }

            throw new Error("Invalid response Content-Type: " +  (contentType ?? "undefined") + ", from URL: " + url);
        }
        else if (response.status === 400) {
            const contentType = response.headers.get("Content-Type");
            if (contentType) {
                const found = allowedContentTypes.find(item => contentType.startsWith(item));
                if (found) {
                    try {
                        const json = await response.json();
                        if (json && json.error) {
                            Log.error("JsonService.postForm: Error from server: ", json.error);
                            throw new Error(payload.error);
                        }

                        return json;
                    }
                    catch (err) {
                        Log.error("JsonService.postForm: Error parsing JSON response", err instanceof Error ? err.message : err);
                        throw err;
                    }
                }
            }

            throw new Error("Invalid response Content-Type: " +  (contentType ?? "undefined") + ", from URL: " + url);
        }

        throw new Error(response.statusText + " (" + response.status.toString() + ")");
    }
}
