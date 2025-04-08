// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

/**
 * @internal
 */
export class UrlUtils {
    public static readParams(url: string, responseMode: "query" | "fragment" = "query"): URLSearchParams {
        if (!url) throw new TypeError("Invalid URL");
        // the base URL is irrelevant, it's just here to support relative url arguments
        const parsedUrl = new URL(url, "http://127.0.0.1");
        const params = parsedUrl[responseMode === "fragment" ? "hash" : "search"];
        return new URLSearchParams(params.slice(1));
    }
}

/**
 * @internal
 */
export const URL_STATE_DELIMITER = ";";