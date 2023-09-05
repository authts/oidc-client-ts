// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import type { IWindow } from "./IWindow";

/**
 * @public
 */
export interface INavigator {
    prepare(params: unknown): Promise<IWindow>;

    callback(url: string, params?: unknown): Promise<void>;
}
