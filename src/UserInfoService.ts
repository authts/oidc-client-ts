// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, JwtUtils } from "./utils";
import { JsonService } from "./JsonService";
import type { MetadataService } from "./MetadataService";
import type { IdTokenClaims, JwtClaims } from "./Claims";
import type { OidcClientSettingsStore } from "./OidcClientSettings";
import type { ClaimsService } from "./ClaimsService";

/**
 * @internal
 */
export class UserInfoService {
    protected readonly _logger = new Logger("UserInfoService");
    private readonly _jsonService: JsonService;

    public constructor(private readonly _settings: OidcClientSettingsStore,
        private readonly _metadataService: MetadataService,
        private readonly _claimsService: ClaimsService,
    ) {
        this._jsonService = new JsonService(undefined, this._getClaimsFromJwt);
    }

    public async getClaims(token: string, profile: IdTokenClaims, validateSub = true): Promise<IdTokenClaims> {
        const logger = this._logger.create("getClaims");
        if (!token) {
            logger.throw(new Error("No token passed"));
        }

        const url = await this._metadataService.getUserInfoEndpoint();
        logger.debug("got userinfo url", url);

        const claims = await this._jsonService.getJson(url, {
            token,
            credentials: this._settings.fetchRequestCredentials,
        });
        logger.debug("user info claims received from user info endpoint");

        if (validateSub && profile && claims.sub !== profile.sub) {
            logger.throw(new Error("subject from UserInfo response does not match subject in ID Token"));
        }

        const filteredClaims = this._claimsService.filterProtocolClaims(claims as IdTokenClaims);

        return this._claimsService.mergeClaims(profile, filteredClaims);
    }

    protected _getClaimsFromJwt = async (responseText: string): Promise<JwtClaims> => {
        const logger = this._logger.create("_getClaimsFromJwt");
        try {
            const payload = JwtUtils.decode(responseText);
            logger.debug("JWT decoding successful");

            return payload;
        } catch (err) {
            logger.error("Error parsing JWT response");
            throw err;
        }
    };
}
