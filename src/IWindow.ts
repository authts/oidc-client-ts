// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

export interface IWindow {
    navigate(params: any): Promise<unknown>;
    close(): void;
}
