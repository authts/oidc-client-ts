// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.
/**
 * @internal
 */
export interface NavigateParams {
    url: string;
    /** The request "state" parameter. For sign out requests, this parameter is optional. */
    state?: string;
    response_mode?: "query" | "fragment";
}

/**
 * @internal
 */
export interface NavigateResponse {
    url: string;
}

/**
 * @internal
 */
export interface IWindow {
    navigate(params: NavigateParams): Promise<NavigateResponse>;
    close(): void;
}
