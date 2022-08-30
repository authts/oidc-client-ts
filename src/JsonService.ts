// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { ErrorResponse, ErrorTimeout } from "./errors";
import { Logger } from "./utils";

/**
 * @internal
 */
export type JwtHandler = (text: string) => Promise<Record<string, unknown>>;

/**
 * @internal
 */
export interface GetJsonOpts {
    token?: string;
}

/**
 * @internal
 */
export interface PostFormOpts {
    body: URLSearchParams;
    basicAuth?: string;
    timeoutInSeconds?: number;
    initCredentials?: "same-origin" | "include" | "omit";
}

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

    protected async fetchWithTimeout(input: RequestInfo, init: RequestInit & { timeoutInSeconds?: number } = {}) {
        const { timeoutInSeconds, ...initFetch } = init;
        if (!timeoutInSeconds) {
            return await fetch(input, initFetch);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutInSeconds * 1000);

        try {
            const response = await fetch(input, {
                ...init,
                signal: controller.signal,
            });
            return response;
        }
        catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") {
                throw new ErrorTimeout("Network timed out");
            }
            throw err;
        }
        finally {
            clearTimeout(timeoutId);
        }
    }

    public async getJson(url: string, {
        token,
    }: GetJsonOpts = {}): Promise<Record<string, unknown>> {
        const logger = this._logger.create("getJson");
        const headers: HeadersInit = {
            "Accept": this._contentTypes.join(", "),
        };
        if (token) {
            logger.debug("token passed, setting Authorization header");
            headers["Authorization"] = "Bearer " + token;
        }

        let response: Response;
        try {
            logger.debug("url:", url);
            response = await this.fetchWithTimeout(url, { method: "GET", headers });
        }
        catch (err) {
            logger.error("Network Error");
            throw err;
        }

        logger.debug("HTTP response received, status", response.status);
        const contentType = response.headers.get("Content-Type");
        if (contentType && !this._contentTypes.find(item => contentType.startsWith(item))) {
            logger.throw(new Error(`Invalid response Content-Type: ${(contentType ?? "undefined")}, from URL: ${url}`));
        }
        if (response.ok && this._jwtHandler && contentType?.startsWith("application/jwt")) {
            return await this._jwtHandler(await response.text());
        }
        let json: Record<string, unknown>;
        try {
            json = await response.json();
        }
        catch (err) {
            logger.error("Error parsing JSON response", err);
            if (response.ok) throw err;
            throw new Error(`${response.statusText} (${response.status})`);
        }
        if (!response.ok) {
            logger.error("Error from server:", json);
            if (json.error) {
                throw new ErrorResponse(json);
            }
            throw new Error(`${response.statusText} (${response.status}): ${JSON.stringify(json)}`);
        }
        return json;
    }

    public async postForm(url: string, {
        body,
        basicAuth,
        timeoutInSeconds,
        initCredentials,
    }: PostFormOpts): Promise<Record<string, unknown>> {
        const logger = this._logger.create("postForm");
        const headers: HeadersInit = {
            "Accept": this._contentTypes.join(", "),
            "Content-Type": "application/x-www-form-urlencoded",
        };
        if (basicAuth !== undefined) {
            headers["Authorization"] = "Basic " + basicAuth;
        }

        let response: Response;
        try {
            logger.debug("url:", url);
            response = await this.fetchWithTimeout(url, { method: "POST", headers, body, timeoutInSeconds, credentials: initCredentials });
        }
        catch (err) {
            logger.error("Network error");
            throw err;
        }

        logger.debug("HTTP response received, status", response.status);
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
                logger.error("Error parsing JSON response", err);
                if (response.ok) throw err;
                throw new Error(`${response.statusText} (${response.status})`);
            }
        }

        if (!response.ok) {
            logger.error("Error from server:", json);
            if (json.error) {
                throw new ErrorResponse(json, body);
            }
            throw new Error(`${response.statusText} (${response.status}): ${JSON.stringify(json)}`);
        }

        return json;
    }
}
