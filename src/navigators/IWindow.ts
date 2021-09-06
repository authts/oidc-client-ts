// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

export interface NavigatorParams {
    url?: string;
    id?: string;
    startUrl?: string;
    popupWindowFeatures?: string;
    popupWindowTarget?: string;
    silentRequestTimeout?: number;
    redirectMethod?: "replace" | "assign";
}

export interface IWindow {
    navigate(params: NavigatorParams): Promise<any>;
    close(): void;
}
