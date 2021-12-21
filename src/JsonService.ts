// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { ErrorResponse } from "./ErrorResponse";
import { Logger } from "./utils";

/**
 * @internal
 */
export type JwtHandler = (text: string) => Promise<Record<string, unknown>>;

/**
 * @internal
 */
export class JsonService {
    private readonly _logger = new Logger("JsonService");

    private _contentTypes: string[] = [];

    public constructor(
        additionalContentTypes: string[] = [],
        private _jwtHandler: JwtHandler | null = null,
    ) {
        this._contentTypes.push(...additionalContentTypes, "application/json");
        if (_jwtHandler) {
            this._contentTypes.push("application/jwt");
        }
    }

    public async getJson(url: string, token?: string): Promise<Record<string, unknown>> {
        const headers: HeadersInit = {
            "Accept": this._contentTypes.join(", "),
        };
        if (token) {
            this._logger.debug("getJson: token passed, setting Authorization header");
            headers["Authorization"] = "Bearer " + token;
        }

        let response: Response;
        try {
            this._logger.debug("getJson, url:", url);
            response = await fetch(url, { method: "GET", headers });
        }
        catch (err) {
            this._logger.error("getJson: network error");
            throw new Error("Network Error");
        }

        this._logger.debug("getJson: HTTP response received, status", response.status);
        const contentType = response.headers.get("Content-Type");
        if (contentType && !this._contentTypes.find(item => contentType.startsWith(item))) {
            throw new Error(`Invalid response Content-Type: ${(contentType ?? "undefined")}, from URL: ${url}`);
        }
        if (response.ok && this._jwtHandler && contentType?.startsWith("application/jwt")) {
            return await this._jwtHandler(await response.text());
        }
        let json: Record<string, unknown>;
        try {
            json = await response.json();
        }
        catch (err) {
            this._logger.error("getJson: Error parsing JSON response", err);
            if (response.ok) throw err;
            throw new Error(`${response.statusText} (${response.status})`);
        }
        if (!response.ok) {
            this._logger.error("getJson: Error from server:", json);
            if (json.error) {
                throw new ErrorResponse(json);
            }
            throw new Error(`${response.statusText} (${response.status}): ${JSON.stringify(json)}`);
        }
        return json;
    }

    public async postForm(url: string, body: URLSearchParams, basicAuth?: string): Promise<Record<string, unknown>> {
        const headers: HeadersInit = {
            "Accept": this._contentTypes.join(", "),
            "Content-Type": "application/x-www-form-urlencoded",
        };
        if (basicAuth !== undefined) {
            headers["Authorization"] = "Basic " + basicAuth;
        }

        let response: Response;
        try {
            this._logger.debug("postForm, url:", url);
            response = await fetch(url, { method: "POST", headers, body });
        }
        catch (err) {
            this._logger.error("postForm: network error");
            throw new Error("Network Error");
        }

        this._logger.debug("postForm: HTTP response received, status", response.status);
        const contentType = response.headers.get("Content-Type");
        if (contentType && !this._contentTypes.find(item => contentType.startsWith(item))) {
            throw new Error(`Invalid response Content-Type: ${(contentType ?? "undefined")}, from URL: ${url}`);
        }

        const responseText = await response.text();

        let json: Record<string, unknown> = {};
        if (responseText) {
            try {
                json = JSON.parse(responseText);
            }
            catch (err) {
                this._logger.error("postForm: Error parsing JSON response", err);
                if (response.ok) throw err;
                throw new Error(`${response.statusText} (${response.status})`);
            }
        }

        if (!response.ok) {
            this._logger.error("postForm: Error from server:", json);
            if (json.error) {
                throw new ErrorResponse(json, body);
            }
            throw new Error(`${response.statusText} (${response.status}): ${JSON.stringify(json)}`);
        }

        return json;
    }
}
