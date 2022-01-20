// Copyright (C) 2021 AuthTS Contributors
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

/**
 * Error class thrown in case of network timeouts (e.g IFrame time out).
 *
 * @public
 */
export class ErrorTimeout extends Error {
    /** Marker to detect class: "ErrorTimeout" */
    public readonly name: string = "ErrorTimeout";

    public constructor(message?: string) {
        super(message);
    }
}
