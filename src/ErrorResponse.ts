// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "./utils";

/**
 * @internal
 */
export class ErrorResponse extends Error {
    public readonly name: string;

    public readonly error: string;
    public readonly error_description: string | undefined;
    public readonly error_uri: string | undefined;

    public readonly session_state: string | undefined;

    /** custom "state", which can be used by a caller to have "data" round tripped */
    public state: unknown | undefined;

    public constructor(args: {
        error?: string; error_description?: string; error_uri?: string; state?: unknown; session_state?: string;
    }) {
        super(args.error_description || args.error);

        if (!args.error) {
            Logger.error("ErrorResponse", "No error passed");
            throw new Error("No error passed");
        }

        this.name = "ErrorResponse";

        this.error = args.error;
        this.error_description = args.error_description;
        this.error_uri = args.error_uri;

        this.state = args.state;
        this.session_state = args.session_state;
    }
}
