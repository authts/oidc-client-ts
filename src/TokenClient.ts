// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { JsonService } from "./JsonService";
import { MetadataService } from "./MetadataService";
import { Log } from "./utils";
import { OidcClientSettingsStore } from "./OidcClientSettings";

interface ExchangeCodeArgs {
    client_id?: string;
    client_secret?: string;
    redirect_uri?: string;

    grant_type?: string;
    code: string;
    code_verifier: string;
}

interface ExchangeRefreshTokenArgs {
    client_id?: string;
    client_secret?: string;

    grant_type?: string;
    refresh_token: string;
}

export class TokenClient {
    private readonly _settings: OidcClientSettingsStore;
    private readonly _jsonService: JsonService;
    private readonly _metadataService: MetadataService;

    public constructor(settings: OidcClientSettingsStore, metadataService: MetadataService) {
        this._settings = settings;
        this._jsonService = new JsonService();
        this._metadataService = metadataService;
    }

    public async exchangeCode(args: ExchangeCodeArgs): Promise<any> {
        args = Object.assign({}, args);

        args.grant_type = args.grant_type || "authorization_code";
        args.client_id = args.client_id || this._settings.client_id;
        args.client_secret = args.client_secret || this._settings.client_secret;
        args.redirect_uri = args.redirect_uri || this._settings.redirect_uri;

        const client_authentication = this._settings.client_authentication;

        if (!args.client_id) {
            Log.error("TokenClient.exchangeCode: No client_id passed");
            throw new Error("A client_id is required");
        }
        if (!args.redirect_uri) {
            Log.error("TokenClient.exchangeCode: No redirect_uri passed");
            throw new Error("A redirect_uri is required");
        }
        if (!args.code) {
            Log.error("TokenClient.exchangeCode: No code passed");
            throw new Error("A code is required");
        }
        if (!args.code_verifier) {
            Log.error("TokenClient.exchangeCode: No code_verifier passed");
            throw new Error("A code_verifier is required");
        }

        // Sending the client credentials using the Basic Auth method
        let basicAuth: string | undefined = undefined;
        if (client_authentication == "client_secret_basic") {
            if (!args.client_secret) {
                Log.error("TokenClient.exchangeCode: No client_secret passed");
                throw new Error("A client_secret is required");
            }

            basicAuth = args.client_id + ":" + args.client_secret;
            delete args.client_id;
            delete args.client_secret;
        }

        const url = await this._metadataService.getTokenEndpoint(false);
        Log.debug("TokenClient.exchangeCode: Received token endpoint");

        const response = await this._jsonService.postForm(url as string, args, basicAuth);
        Log.debug("TokenClient.exchangeCode: response received");

        return response;
    }

    public async exchangeRefreshToken(args: ExchangeRefreshTokenArgs): Promise<any> {
        args = Object.assign({}, args);

        args.grant_type = args.grant_type || "refresh_token";
        args.client_id = args.client_id || this._settings.client_id;
        args.client_secret = args.client_secret || this._settings.client_secret;

        const client_authentication = this._settings.client_authentication;

        if (!args.refresh_token) {
            Log.error("TokenClient.exchangeRefreshToken: No refresh_token passed");
            throw new Error("A refresh_token is required");
        }
        if (!args.client_id) {
            Log.error("TokenClient.exchangeRefreshToken: No client_id passed");
            throw new Error("A client_id is required");
        }

        // Sending the client credentials using the Basic Auth method
        let basicAuth: string | undefined = undefined;
        if (client_authentication == "client_secret_basic") {
            if (!args.client_secret) {
                Log.error("TokenClient.exchangeCode: No client_secret passed");
                throw new Error("A client_secret is required");
            }

            basicAuth = args.client_id + ":" + args.client_secret;
            delete args.client_id;
            delete args.client_secret;
        }

        const url = await this._metadataService.getTokenEndpoint(false);
        Log.debug("TokenClient.exchangeRefreshToken: Received token endpoint");

        const response = await this._jsonService.postForm(url as string, args, basicAuth);
        Log.debug("TokenClient.exchangeRefreshToken: response received");

        return response;
    }
}
