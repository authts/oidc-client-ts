// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { UrlUtility } from "./utils";

export class SignoutResponse {
    public error?: string;
    public error_description?: string;
    public error_uri?: string;
    public state?: any;

    constructor(url?: string) {
        const values = UrlUtility.parseUrlFragment(url, "?");

        this.error = values.error;
        this.error_description = values.error_description;
        this.error_uri = values.error_uri;

        this.state = values.state;
    }
}
