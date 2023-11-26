// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

/**
 * @public
 */
export interface NavigateParams {
    url: string;
    /** The request "nonce" parameter. */
    nonce?: string;
    /** The request "state" parameter. For sign out requests, this parameter is optional. */
    state?: string;
    response_mode?: "query" | "fragment";
    /** Search for the callback parameters in the hash part of the URL */
    hashRouterMode?: boolean;
    scriptOrigin?: string;
}

/**
 * @public
 */
export interface NavigateResponse {
    url: string;
}

/**
 * @public
 */
export interface IWindow {
    navigate(params: NavigateParams): Promise<NavigateResponse>;
    close(): void;
}
