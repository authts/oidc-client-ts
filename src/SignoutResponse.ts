// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { UrlUtils } from "./utils";

export class SignoutResponse {
    public error: string | undefined;
    public error_description: string | undefined;
    public error_uri: string | undefined;

    public state: any | undefined;

    public constructor(url?: string) {
        const values = UrlUtils.parseUrlFragment(url, "?");

        this.error = values.error;
        this.error_description = values.error_description;
        this.error_uri = values.error_uri;

        this.state = values.state;
    }
}
