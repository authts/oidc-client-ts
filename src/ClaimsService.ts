// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import type { JwtClaims } from "./Claims";
import type { OidcClientSettingsStore } from "./OidcClientSettings";
import type { UserProfile } from "./User";
import { Logger } from "./utils";

/**
 * Protocol claims that could be removed by default from profile.
 * Derived from the following sets of claims:
 * - {@link https://datatracker.ietf.org/doc/html/rfc7519.html#section-4.1}
 * - {@link https://openid.net/specs/openid-connect-core-1_0.html#IDToken}
 * - {@link https://openid.net/specs/openid-connect-core-1_0.html#CodeIDToken}
 *
 * @internal
 */
const DefaultProtocolClaims = [
    "nbf",
    "jti",
    "auth_time",
    "nonce",
    "acr",
    "amr",
    "azp",
    "at_hash", // https://openid.net/specs/openid-connect-core-1_0.html#CodeIDToken
] as const;

/**
 * Protocol claims that should never be removed from profile.
 * "sub" is needed internally and others should remain required as per the OIDC specs.
 *
 * @internal
 */
const InternalRequiredProtocolClaims = ["sub", "iss", "aud", "exp", "iat"];

/**
 * @internal
 */
export class ClaimsService {
    protected readonly _logger = new Logger("ClaimsService");
    public constructor(
        protected readonly _settings: OidcClientSettingsStore,
    ) {}

    public filterProtocolClaims(claims: UserProfile): UserProfile {
        const result = { ...claims };

        if (this._settings.filterProtocolClaims) {
            let protocolClaims;
            if (Array.isArray(this._settings.filterProtocolClaims)) {
                protocolClaims = this._settings.filterProtocolClaims;
            } else {
                protocolClaims = DefaultProtocolClaims;
            }

            for (const claim of protocolClaims) {
                if (!InternalRequiredProtocolClaims.includes(claim)) {
                    delete result[claim];
                }
            }
        }

        return result;
    }

    public mergeClaims(claims1: UserProfile, claims2: JwtClaims): UserProfile {
        const result = { ...claims1 };

        for (const [claim, values] of Object.entries(claims2)) {
            for (const value of Array.isArray(values) ? values : [values]) {
                const previousValue = result[claim];
                if (previousValue === undefined) {
                    result[claim] = value;
                }
                else if (Array.isArray(previousValue)) {
                    if (!previousValue.includes(value)) {
                        previousValue.push(value);
                    }
                }
                else if (result[claim] !== value) {
                    if (typeof value === "object" && this._settings.mergeClaims) {
                        result[claim] = this.mergeClaims(previousValue as UserProfile, value);
                    }
                    else {
                        result[claim] = [previousValue, value];
                    }
                }
            }
        }

        return result;
    }
}
