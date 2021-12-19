// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "./utils";

/**
 * Error class thrown in case of an authentication error.
 *
 * See https://openid.net/specs/openid-connect-core-1_0.html#AuthError
 *
 * @public
 */
export class ErrorResponse extends Error {
    /** Marker to detect class: "ErrorResponse" */
    public readonly name: string = "ErrorResponse";

    /** An error code string that can be used to classify the types of errors that occur and to respond to errors. */
    public readonly error: string;
    /** additional information that can help a developer identify the cause of the error.*/
    public readonly error_description: string | undefined;
    /**
     * URI identifying a human-readable web page with information about the error, used to provide the client
       developer with additional information about the error.
    */
    public readonly error_uri: string | undefined;

    /** custom "state", which can be used by a caller to have "data" round tripped */
    public state: unknown | undefined;

    public readonly session_state: string | undefined;

    public constructor(
        args: {
            error?: string; error_description?: string; error_uri?: string;
            state?: unknown; session_state?: string;
        },
        /** The x-www-form-urlencoded request body sent to the authority server */
        public readonly form?: URLSearchParams,
    ) {
        super(args.error_description || args.error);

        if (!args.error) {
            Logger.error("ErrorResponse", "No error passed");
            throw new Error("No error passed");
        }

        this.error = args.error;
        this.error_description = args.error_description;
        this.error_uri = args.error_uri;

        this.state = args.state;
        this.session_state = args.session_state;
    }
}
