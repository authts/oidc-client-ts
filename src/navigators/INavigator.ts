// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import type { IWindow, NavigateParams } from "./IWindow";

export interface INavigator {
    prepare(params: NavigateParams): Promise<IWindow>;
}
