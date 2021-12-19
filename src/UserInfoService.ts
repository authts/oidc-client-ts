// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, JwtUtils } from "./utils";
import { JsonService } from "./JsonService";
import type { MetadataService } from "./MetadataService";
import type { JwtClaims } from "./Claims";

/**
 * @internal
 */
export class UserInfoService {
    protected readonly _logger: Logger;
    private _jsonService: JsonService;
    private _metadataService: MetadataService;

    public constructor(metadataService: MetadataService) {
        this._logger = new Logger("UserInfoService");
        this._jsonService = new JsonService(undefined, this._getClaimsFromJwt);
        this._metadataService = metadataService;
    }

    public async getClaims(token: string): Promise<JwtClaims> {
        if (!token) {
            this._logger.error("getClaims: No token passed");
            throw new Error("A token is required");
        }

        const url = await this._metadataService.getUserInfoEndpoint();
        this._logger.debug("getClaims: received userinfo url", url);

        const claims = await this._jsonService.getJson(url, token);
        this._logger.debug("getClaims: claims received", claims);

        return claims;
    }

    protected _getClaimsFromJwt = async (responseText: string): Promise<JwtClaims> => {
        try {
            const payload = JwtUtils.decode(responseText);
            this._logger.debug("_getClaimsFromJwt: JWT decoding successful");

            return payload;
        }
        catch (err) {
            this._logger.error("_getClaimsFromJwt: Error parsing JWT response", err instanceof Error ? err.message : err);
            throw err;
        }
    };
}
