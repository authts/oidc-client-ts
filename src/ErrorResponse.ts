// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "./utils";

export class ErrorResponse extends Error {
    public readonly name: string;

    public readonly error: string;
    public readonly error_description: string | undefined;
    public readonly error_uri: string | undefined;

    public readonly state: any;
    public readonly session_state: string | undefined;

    public constructor(args: {
        error?: string; error_description?: string; error_uri?: string; state?: any; session_state?: string;
    }) {
        if (!args.error) {
            Log.error("No error passed to ErrorResponse");
            throw new Error("error");
        }

        super(args.error_description || args.error);

        this.name = "ErrorResponse";

        this.error = args.error;
        this.error_description = args.error_description;
        this.error_uri = args.error_uri;

        this.state = args.state;
        this.session_state = args.session_state;
    }
}
