// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, JoseUtil } from "./utils";
import { JsonService } from "./JsonService";
import { MetadataService } from "./MetadataService";
import { OidcClientSettingsStore } from "./OidcClientSettings";

export class UserInfoService {
    private _settings: OidcClientSettingsStore;
    private _jsonService: JsonService;
    private _metadataService: MetadataService;

    public constructor(settings: OidcClientSettingsStore, metadataService: MetadataService) {
        this._settings = settings;
        this._jsonService = new JsonService(undefined, this._getClaimsFromJwt.bind(this));
        this._metadataService = metadataService;
    }

    public async getClaims(token?: string) {
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

    protected async _getClaimsFromJwt(responseText: string) {
        try {
            const jwt = JoseUtil.parseJwt(responseText);
            if (!jwt || !jwt.header || !jwt.payload) {
                Log.error("UserInfoService._getClaimsFromJwt: Failed to parse JWT", jwt);
                throw new Error("Failed to parse id_token");
            }

            const header: any = jwt.header;
            const payload: any = jwt.payload;

            let issuer: string;
            switch (this._settings.userInfoJwtIssuer) {
                case "OP":
                    issuer = await this._metadataService.getIssuer();
                    break;
                case "ANY":
                    issuer = payload.iss;
                    break;
                default:
                    issuer = this._settings.userInfoJwtIssuer as string;
                    break;
            }

            Log.debug("UserInfoService._getClaimsFromJwt: Received issuer:" + issuer);

            let keys = await this._metadataService.getSigningKeys();
            if (!keys) {
                Log.error("UserInfoService._getClaimsFromJwt: No signing keys from metadata");
                throw new Error("No signing keys from metadata");
            }

            Log.debug("UserInfoService._getClaimsFromJwt: Received signing keys");
            let key: Record<string, string> | null;
            if (header.kid) {
                key = keys.filter(key => key.kid === header.kid)[0] ?? null;
            } else {
                keys = this._filterByAlg(keys, jwt.header.alg);
                if (keys.length !== 1) {
                    Log.error("UserInfoService._getClaimsFromJwt: No kid found in id_token and more than one key found in metadata");
                    throw new Error("No kid found in id_token and more than one key found in metadata");
                }

                // kid is mandatory only when there are multiple keys in the referenced JWK Set document
                // see http://openid.net/specs/openid-connect-core-1_0.html#Signing
                key = keys[0];
            }

            if (!key) {
                Log.error("UserInfoService._getClaimsFromJwt: No key matching kid or alg found in signing keys");
                throw new Error("No key matching kid or alg found in signing keys");
            }

            const audience = this._settings.client_id;
            const clockSkewInSeconds = this._settings.clockSkewInSeconds;
            Log.debug("UserInfoService._getClaimsFromJwt: Validaing JWT; using clock skew (in seconds) of: ", clockSkewInSeconds);

            await JoseUtil.validateJwt(responseText, key, issuer, audience, clockSkewInSeconds, undefined, true);
            Log.debug("UserInfoService._getClaimsFromJwt: JWT validation successful");
            return payload;
        }
        catch (err) {
            Log.error("UserInfoService._getClaimsFromJwt: Error parsing JWT response", err instanceof Error ? err.message : err);
            throw err;
        }
    }

    protected _filterByAlg(keys: Record<string, string>[], alg: string) {
        let kty: string | null = null;
        if (alg.startsWith("RS")) {
            kty = "RSA";
        }
        else if (alg.startsWith("PS")) {
            kty = "PS";
        }
        else if (alg.startsWith("ES")) {
            kty = "EC";
        }
        else {
            Log.debug("UserInfoService._filterByAlg: alg not supported: ", alg);
            return [];
        }

        Log.debug("UserInfoService._filterByAlg: Looking for keys that match kty: ", kty);

        keys = keys.filter(key => {
            return key.kty === kty;
        });

        Log.debug("UserInfoService._filterByAlg: Number of keys that match kty: ", kty, keys.length);
        return keys;
    }
}
