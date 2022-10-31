// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

/**
 * @internal
 */
export class UrlUtils {
    public static readParams(url: string, responseMode: "query" | "fragment" = "query"): URLSearchParams {
        if (!url) throw new TypeError("Invalid URL");

        // if we're doing query, then strip off hash fragment before we parse
        if (responseMode === "query") {
            const hashIdx = url.indexOf("#");
            if (hashIdx >= 0) {
                url = url.substring(hashIdx + 1);
            }
        }

        const parsedUrl = new URL(url, window.location.origin);
        const params = parsedUrl[responseMode === "fragment" ? "hash" : "search"];
        return new URLSearchParams(params.slice(1));
    }
}
