// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { UrlUtils } from "./utils";

/**
 * @public
 */
export class SignoutResponse {
    public readonly state_id: string | undefined;

    // updated by ResponseValidator
    public error: string | undefined;
    public error_description: string | undefined;
    public error_uri: string | undefined;

    // set by ResponseValidator
    /** custom "state", which can be used by a caller to have "data" round tripped */
    public state: unknown | undefined;

    public constructor(url?: string) {
        const values = UrlUtils.parseUrlFragment(url, "?");

        this.error = values.error;
        this.error_description = values.error_description;
        this.error_uri = values.error_uri;

        this.state_id = values.state;

        this.state = undefined;
    }
}
