// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "./utils";
import { MetadataService } from "./MetadataService";
import { OidcClientSettingsStore } from "./OidcClientSettings";

const AccessTokenTypeHint = "access_token";
const RefreshTokenTypeHint = "refresh_token";

export class TokenRevocationClient {
    private _settings: OidcClientSettingsStore
    private _metadataService: MetadataService;

    public constructor(settings: OidcClientSettingsStore, metadataService: MetadataService) {
        this._settings = settings;
        this._metadataService = metadataService;
    }

    public async revoke(token: string, required: boolean, type = "access_token"): Promise<void> {
        if (!token) {
            Log.error("TokenRevocationClient.revoke: No token provided");
            throw new Error("No token provided.");
        }

        if (type !== AccessTokenTypeHint && type != RefreshTokenTypeHint) {
            Log.error("TokenRevocationClient.revoke: Invalid token type");
            throw new Error("Invalid token type.");
        }

        const url = await this._metadataService.getRevocationEndpoint();
        if (!url) {
            if (required) {
                Log.error("TokenRevocationClient.revoke: Revocation not supported");
                throw new Error("Revocation not supported");
            }

            // not required, so don't error and just return
            return;
        }

        Log.debug("TokenRevocationClient.revoke: Revoking " + type);
        const client_id = this._settings.client_id;
        const client_secret = this._settings.client_secret;
        await this._revoke(url, client_id, client_secret, token, type);
    }

    protected async _revoke(url: string, client_id: string, client_secret: string | undefined, token: string, type: string): Promise<void> {
        const headers: HeadersInit = {
            "Content-Type": "application/x-www-form-urlencoded",
        };

        const body = new URLSearchParams();
        body.set("client_id", client_id);
        if (client_secret) {
            body.set("client_secret", client_secret);
        }
        body.set("token_type_hint", type);
        body.set("token", token);

        let response: Response;
        try {
            Log.debug("TokenRevocationClient.revoke, url: ", url);
            response = await fetch(url, { method: "POST", headers, body });
        }
        catch (err) {
            Log.error("TokenRevocationClient.revoke: network error");
            throw new Error("Network Error");
        }

        Log.debug("TokenRevocationClient.revoke: HTTP response received, status", response.status);
        if (response.status !== 200) {
            throw new Error(response.statusText + " (" + response.status.toString() + ")");
        }
    }
}
