// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "../utils";

/**
 * Error class thrown in case of an authentication error.
 *
 * @public
 * @see https://openid.net/specs/openid-connect-core-1_0.html#AuthError
 */
export class ErrorResponse extends Error {
    /** Marker to detect class: "ErrorResponse" */
    public readonly name: string = "ErrorResponse";

    /** An error code string that can be used to classify the types of errors that occur and to respond to errors. */
    public readonly error: string | null;
    /** additional information that can help a developer identify the cause of the error.*/
    public readonly error_description: string | null;
    /**
     * URI identifying a human-readable web page with information about the error, used to provide the client
       developer with additional information about the error.
    */
    public readonly error_uri: string | null;

    /** custom state data set during the initial signin request */
    public state?: unknown;

    public readonly session_state: string | null;

    public url_state?: string;

    public constructor(
        args: {
            error?: string | null; error_description?: string | null; error_uri?: string | null;
            userState?: unknown; session_state?: string | null; url_state?: string;
        },
        /** The x-www-form-urlencoded request body sent to the authority server */
        public readonly form?: URLSearchParams,
    ) {
        super(args.error_description || args.error || "");

        if (!args.error) {
            Logger.error("ErrorResponse", "No error passed");
            throw new Error("No error passed");
        }

        this.error = args.error;
        this.error_description = args.error_description ?? null;
        this.error_uri = args.error_uri ?? null;

        this.state = args.userState;
        this.session_state = args.session_state ?? null;
        this.url_state = args.url_state;
    }
}
