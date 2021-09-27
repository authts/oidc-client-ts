// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

export interface NavigateParams {
    url?: string;
    id?: string;
    startUrl?: string;
    popupWindowFeatures?: string;
    popupWindowTarget?: string;
    silentRequestTimeoutInSeconds?: number;
    redirectMethod?: "replace" | "assign";
}

export interface NavigateResponse {
    url?: string;
}

export interface IWindow {
    navigate(params: NavigateParams): Promise<NavigateResponse>;
    close(): void;
}
