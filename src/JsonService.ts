// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from './utils';

export class JsonService {
    private _contentTypes: string[];
    private _jwtHandler: any;

    constructor(
        additionalContentTypes: string[] | null = null,
        jwtHandler: any = null
    ) {
        if (additionalContentTypes && Array.isArray(additionalContentTypes))
        {
            this._contentTypes = additionalContentTypes.slice();
        }
        else
        {
            this._contentTypes = [];
        }
        this._contentTypes.push('application/json');
        if (jwtHandler) {
            this._contentTypes.push('application/jwt');
        }

        this._jwtHandler = jwtHandler;
    }

    async getJson(url: string, token?: string): Promise<any> {
        if (!url){
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
            response = await fetch(url, { method: 'GET', headers });
        } catch (err) {
            Log.error("JsonService.getJson: network error");
            throw new Error("Network Error");
        }

        const allowedContentTypes = this._contentTypes;
        const jwtHandler = this._jwtHandler

        Log.debug("JsonService.getJson: HTTP response received, status", response.status);
        if (response.status === 200) {
            const contentType = response.headers.get("Content-Type");
            if (contentType) {
                var found = allowedContentTypes.find(item => contentType.startsWith(item));
                if (found === "application/jwt") {
                    const text = await response.text();
                    return await jwtHandler(text);
                }

                if (found) {
                    try {
                        const json = await response.json();
                        return json;
                    }
                    catch (e) {
                        Log.error("JsonService.getJson: Error parsing JSON response", e.message);
                        throw e;
                    }
                }
            }

            throw new Error("Invalid response Content-Type: " + contentType + ", from URL: " + url);
        }

        throw new Error(response.statusText + " (" + response.status + ")");
    }

    async postForm(url: string, payload: any, basicAuth?: string): Promise<any> {
        if (!url){
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
        for (let key in payload) {
            let value = payload[key];

            if (value) {
                body.set(key, value);
            }
        }

        let response: Response;
        try {
            Log.debug("JsonService.postForm, url: ", url);
            response = await fetch(url, { method: 'POST', headers, body });
        } catch (err) {
            Log.error("JsonService.postForm: network error");
            throw new Error("Network Error");
        }

        const allowedContentTypes = this._contentTypes;

        Log.debug("JsonService.postForm: HTTP response received, status", response.status);
        if (response.status === 200) {
            const contentType = response.headers.get("Content-Type");
            if (contentType) {
                var found = allowedContentTypes.find(item => contentType.startsWith(item));
                if (found) {
                    try {
                        const json = await response.json();
                        return json;
                    }
                    catch (e) {
                        Log.error("JsonService.postForm: Error parsing JSON response", e.message);
                        throw e;
                    }
                }
            }

            throw new Error("Invalid response Content-Type: " + contentType + ", from URL: " + url);
        }
        else if (response.status === 400) {
            const contentType = response.headers.get("Content-Type");
            if (contentType) {
                var found = allowedContentTypes.find(item => contentType.startsWith(item));
                if (found) {
                    try {
                        const json = await response.json();
                        if (json && json.error) {
                            Log.error("JsonService.postForm: Error from server: ", json.error);
                            throw new Error(payload.error);
                        }

                        return json;
                    }
                    catch (e) {
                        Log.error("JsonService.postForm: Error parsing JSON response", e.message);
                        throw e;
                    }
                }
            }

            throw new Error("Invalid response Content-Type: " + contentType + ", from URL: " + url);
        }

        throw new Error(response.statusText + " (" + response.status + ")");
    }
}
