// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { CryptoUtils, Logger } from "./utils";
import { JsonService } from "./JsonService";
import type { MetadataService } from "./MetadataService";
import type { OidcClientSettingsStore } from "./OidcClientSettings";

/**
 * @internal
 */
export interface ExchangeCodeArgs {
    client_id?: string;
    client_secret?: string;
    redirect_uri?: string;

    grant_type?: string;
    code: string;
    code_verifier?: string;
}

/**
 * @internal
 */
export interface ExchangeRefreshTokenArgs {
    client_id?: string;
    client_secret?: string;

    grant_type?: string;
    refresh_token: string;
    scope?: string;

    timeoutInSeconds?: number;
    refreshTokenCredentials?: "same-origin" | "include" | "omit";
}

/**
 * @internal
 */
export interface RevokeArgs {
    token: string;
    token_type_hint?: "access_token" | "refresh_token";
}

/**
 * @internal
 */
export class TokenClient {
    private readonly _logger = new Logger("TokenClient");
    private readonly _jsonService = new JsonService();

    public constructor(
        private readonly _settings: OidcClientSettingsStore,
        private readonly _metadataService: MetadataService,
    ) {}

    public async exchangeCode({
        grant_type = "authorization_code",
        redirect_uri = this._settings.redirect_uri,
        client_id = this._settings.client_id,
        client_secret = this._settings.client_secret,
        ...args
    }: ExchangeCodeArgs): Promise<Record<string, unknown>> {
        const logger = this._logger.create("exchangeCode");
        if (!client_id) {
            logger.throw(new Error("A client_id is required"));
        }
        if (!redirect_uri) {
            logger.throw(new Error("A redirect_uri is required"));
        }
        if (!args.code) {
            logger.throw(new Error("A code is required"));
        }
        if (!args.code_verifier) {
            logger.throw(new Error("A code_verifier is required"));
        }

        const params = new URLSearchParams({ grant_type, redirect_uri });
        for (const [key, value] of Object.entries(args)) {
            if (value != null) {
                params.set(key, value);
            }
        }
        let basicAuth: string | undefined;
        switch (this._settings.client_authentication) {
            case "client_secret_basic":
                if (!client_secret) {
                    logger.throw(new Error("A client_secret is required"));
                    throw null; // https://github.com/microsoft/TypeScript/issues/46972
                }
                basicAuth = CryptoUtils.generateBasicAuth(client_id, client_secret);
                break;
            case "client_secret_post":
                params.append("client_id", client_id);
                if (client_secret) {
                    params.append("client_secret", client_secret);
                }
                break;
        }

        const url = await this._metadataService.getTokenEndpoint(false);
        logger.debug("got token endpoint");

        const response = await this._jsonService.postForm(url, { body: params, basicAuth });
        logger.debug("got response");

        return response;
    }

    public async exchangeRefreshToken({
        grant_type = "refresh_token",
        client_id = this._settings.client_id,
        client_secret = this._settings.client_secret,
        timeoutInSeconds,
        refreshTokenCredentials,
        ...args
    }: ExchangeRefreshTokenArgs): Promise<Record<string, unknown>> {
        const logger = this._logger.create("exchangeRefreshToken");
        if (!client_id) {
            logger.throw(new Error("A client_id is required"));
        }
        if (!args.refresh_token) {
            logger.throw(new Error("A refresh_token is required"));
        }

        const params = new URLSearchParams({ grant_type });
        for (const [key, value] of Object.entries(args)) {
            if (value != null) {
                params.set(key, value);
            }
        }
        let basicAuth: string | undefined;
        switch (this._settings.client_authentication) {
            case "client_secret_basic":
                if (!client_secret) {
                    logger.throw(new Error("A client_secret is required"));
                    throw null; // https://github.com/microsoft/TypeScript/issues/46972
                }
                basicAuth = CryptoUtils.generateBasicAuth(client_id, client_secret);
                break;
            case "client_secret_post":
                params.append("client_id", client_id);
                if (client_secret) {
                    params.append("client_secret", client_secret);
                }
                break;
        }

        const url = await this._metadataService.getTokenEndpoint(false);
        logger.debug("got token endpoint");

        const response = await this._jsonService.postForm(url, { body: params, basicAuth, timeoutInSeconds, initCredentials: refreshTokenCredentials });
        logger.debug("got response");

        return response;
    }

    /**
     * Revoke an access or refresh token.
     *
     * @see https://datatracker.ietf.org/doc/html/rfc7009#section-2.1
     */
    public async revoke(args: RevokeArgs): Promise<void> {
        const logger = this._logger.create("revoke");
        if (!args.token) {
            logger.throw(new Error("A token is required"));
        }

        const url = await this._metadataService.getRevocationEndpoint(false);

        logger.debug(`got revocation endpoint, revoking ${args.token_type_hint ?? "default token type"}`);

        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(args)) {
            if (value != null) {
                params.set(key, value);
            }
        }
        params.set("client_id", this._settings.client_id);
        if (this._settings.client_secret) {
            params.set("client_secret", this._settings.client_secret);
        }

        await this._jsonService.postForm(url, { body: params });
        logger.debug("got response");
    }
}
