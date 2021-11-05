// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

/**
 * @internal
 */
export class UrlUtils {
    public static readParams(url: string, responseMode: "query" | "fragment" = "query"): URLSearchParams {
        const parsedUrl = new URL(url);
        const params = parsedUrl[responseMode === "fragment" ? "hash" : "search"];
        return new URLSearchParams(params.slice(1));
    }
}
