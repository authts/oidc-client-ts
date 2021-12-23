// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, JwtUtils, JwtPayload } from "./utils";
import { JsonService } from "./JsonService";
import type { MetadataService } from "./MetadataService";

/**
 * @internal
 */
export class UserInfoService {
    protected readonly _logger = new Logger("UserInfoService");
    private readonly _jsonService: JsonService;

    public constructor(private readonly _metadataService: MetadataService) {
        this._jsonService = new JsonService(undefined, this._getClaimsFromJwt);
    }

    public async getClaims(token: string): Promise<JwtPayload> {
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

    protected _getClaimsFromJwt = async (responseText: string): Promise<JwtPayload> => {
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
