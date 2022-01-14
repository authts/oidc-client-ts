// Copyright (C) 2021 AuthTS Contributors
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

/**
 * Error class thrown in case of network timeouts (e.g IFrame time out).
 *
 * @public
 */
export class ErrorNetwork extends TypeError {
    /** Marker to detect class: "ErrorNetwork" */
    public readonly name: string = "ErrorNetwork";

    public constructor(error: TypeError) {
        super(error.message);
    }
}
