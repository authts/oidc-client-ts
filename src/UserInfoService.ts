// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, JwtUtils, JwtPayload } from "./utils";
import { JsonService } from "./JsonService";
import type { MetadataService } from "./MetadataService";

export class UserInfoService {
    private _jsonService: JsonService;
    private _metadataService: MetadataService;

    public constructor(metadataService: MetadataService) {
        this._jsonService = new JsonService(undefined, this._getClaimsFromJwt);
        this._metadataService = metadataService;
    }

    public async getClaims(token: string): Promise<JwtPayload> {
        if (!token) {
            Log.error("UserInfoService.getClaims: No token passed");
            throw new Error("A token is required");
        }

        const url = await this._metadataService.getUserInfoEndpoint();
        Log.debug("UserInfoService.getClaims: received userinfo url", url);

        const claims = await this._jsonService.getJson(url, token);
        Log.debug("UserInfoService.getClaims: claims received", claims);

        return claims;
    }

    protected _getClaimsFromJwt = async (responseText: string): Promise<JwtPayload> => {
        try {
            const payload = JwtUtils.decode(responseText);
            Log.debug("UserInfoService._getClaimsFromJwt: JWT decoding successful");

            return payload;
        }
        catch (err) {
            Log.error("UserInfoService._getClaimsFromJwt: Error parsing JWT response", err instanceof Error ? err.message : err);
            throw err;
        }
    }
}
