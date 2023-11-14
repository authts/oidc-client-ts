// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

/**
 * @public
 */
export interface SessionStatus {
    /** Opaque session state used to validate if session changed (monitorSession) */
    session_state: string;
    /** Subject identifier */
    sub?: string;
}
