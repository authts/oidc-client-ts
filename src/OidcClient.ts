// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, UrlUtils } from "./utils";
import { ErrorResponse } from "./errors";
import { OidcClientSettings, OidcClientSettingsStore } from "./OidcClientSettings";
import { ResponseValidator } from "./ResponseValidator";
import { MetadataService } from "./MetadataService";
import type { RefreshState } from "./RefreshState";
import { SigninRequest } from "./SigninRequest";
import { SigninResponse } from "./SigninResponse";
import { SignoutRequest, SignoutRequestArgs } from "./SignoutRequest";
import { SignoutResponse } from "./SignoutResponse";
import { SigninState } from "./SigninState";
import { State } from "./State";
import { TokenClient } from "./TokenClient";

/**
 * @public
 */
export interface CreateSigninRequestArgs {
    redirect_uri?: string;
    response_type?: string;
    scope?: string;
    nonce?: string;

    /** custom "state", which can be used by a caller to have "data" round tripped */
    state?: unknown;

    prompt?: string;
    display?: string;
    max_age?: number;
    ui_locales?: string;
    id_token_hint?: string;
    login_hint?: string;
    acr_values?: string;
    resource?: string | string[];
    response_mode?: "query" | "fragment";
    request?: string;
    request_uri?: string;
    extraQueryParams?: Record<string, string | number | boolean>;
    request_type?: string;
    client_secret?: string;
    extraTokenParams?: Record<string, unknown>;
    skipUserInfo?: boolean;
}

/**
 * @public
 */
export interface UseRefreshTokenArgs {
    state: RefreshState;
    timeoutInSeconds?: number;
}

/**
 * @public
 */
export type CreateSignoutRequestArgs = Omit<SignoutRequestArgs, "url" | "state_data"> & { state?: unknown };

/**
 * @public
 */
export type ProcessResourceOwnerPasswordCredentialsArgs = {
    username: string;
    password: string;
    skipUserInfo?: boolean;
};

/**
 * Provides the raw OIDC/OAuth2 protocol support for the authorization endpoint and the end session endpoint in the
 * authorization server. It provides a bare-bones protocol implementation and is used by the UserManager class.
 * Only use this class if you simply want protocol support without the additional management features of the
 * UserManager class.
 *
 * @public
 */
export class OidcClient {
    public readonly settings: OidcClientSettingsStore;
    protected readonly _logger = new Logger("OidcClient");

    public readonly metadataService: MetadataService;
    protected readonly _validator: ResponseValidator;
    protected readonly _tokenClient: TokenClient;

    public constructor(settings: OidcClientSettings) {
        this.settings = new OidcClientSettingsStore(settings);

        this.metadataService = new MetadataService(this.settings);
        this._validator = new ResponseValidator(this.settings, this.metadataService);
        this._tokenClient = new TokenClient(this.settings, this.metadataService);
    }

    public async createSigninRequest({
        state,
        request,
        request_uri,
        request_type,
        id_token_hint,
        login_hint,
        skipUserInfo,
        nonce,
        response_type = this.settings.response_type,
        scope = this.settings.scope,
        redirect_uri = this.settings.redirect_uri,
        prompt = this.settings.prompt,
        display = this.settings.display,
        max_age = this.settings.max_age,
        ui_locales = this.settings.ui_locales,
        acr_values = this.settings.acr_values,
        resource = this.settings.resource,
        response_mode = this.settings.response_mode,
        extraQueryParams = this.settings.extraQueryParams,
        extraTokenParams = this.settings.extraTokenParams,
    }: CreateSigninRequestArgs): Promise<SigninRequest> {
        const logger = this._logger.create("createSigninRequest");

        if (response_type !== "code") {
            throw new Error("Only the Authorization Code flow (with PKCE) is supported");
        }

        const url = await this.metadataService.getAuthorizationEndpoint();
        logger.debug("Received authorization endpoint", url);

        const signinRequest = new SigninRequest({
            url,
            authority: this.settings.authority,
            client_id: this.settings.client_id,
            redirect_uri,
            response_type,
            scope,
            state_data: state,
            prompt, display, max_age, ui_locales, id_token_hint, login_hint, acr_values,
            resource, request, request_uri, extraQueryParams, extraTokenParams, request_type, response_mode,
            client_secret: this.settings.client_secret,
            skipUserInfo,
            nonce,
        });

        // house cleaning
        await this.clearStaleState();

        const signinState = signinRequest.state;
        await this.settings.stateStore.set(signinState.id, signinState.toStorageString());
        return signinRequest;
    }

    public async readSigninResponseState(url: string, removeState = false): Promise<{ state: SigninState; response: SigninResponse }> {
        const logger = this._logger.create("readSigninResponseState");

        const response = new SigninResponse(UrlUtils.readParams(url, this.settings.response_mode));
        if (!response.state) {
            logger.throw(new Error("No state in response"));
            // need to throw within this function's body for type narrowing to work
            throw null; // https://github.com/microsoft/TypeScript/issues/46972
        }

        const storedStateString = await this.settings.stateStore[removeState ? "remove" : "get"](response.state);
        if (!storedStateString) {
            logger.throw(new Error("No matching state found in storage"));
            throw null; // https://github.com/microsoft/TypeScript/issues/46972
        }

        const state = SigninState.fromStorageString(storedStateString);
        return { state, response };
    }

    public async processSigninResponse(url: string): Promise<SigninResponse> {
        const logger = this._logger.create("processSigninResponse");

        const { state, response } = await this.readSigninResponseState(url, true);
        logger.debug("received state from storage; validating response");
        await this._validator.validateSigninResponse(response, state);
        return response;
    }

    public async processResourceOwnerPasswordCredentials({
        username,
        password,
        skipUserInfo = false,
    }: ProcessResourceOwnerPasswordCredentialsArgs): Promise<SigninResponse> {
        const tokenResponse: Record<string, unknown> = await this._tokenClient.exchangeCredentials({ username, password });
        const signinResponse: SigninResponse = new SigninResponse(new URLSearchParams());
        Object.assign(signinResponse, tokenResponse);
        await this._validator.validateCredentialsResponse(signinResponse, skipUserInfo);
        return signinResponse;
    }

    public async useRefreshToken({
        state,
        timeoutInSeconds,
    }: UseRefreshTokenArgs): Promise<SigninResponse> {
        const logger = this._logger.create("useRefreshToken");

        const result = await this._tokenClient.exchangeRefreshToken({
            refresh_token: state.refresh_token,
            scope: state.scope,
            timeoutInSeconds,
        });
        const response = new SigninResponse(new URLSearchParams());
        Object.assign(response, result);
        logger.debug("validating response", response);
        await this._validator.validateRefreshResponse(response, state);
        return response;
    }

    public async createSignoutRequest({
        state,
        id_token_hint,
        request_type,
        post_logout_redirect_uri = this.settings.post_logout_redirect_uri,
        extraQueryParams = this.settings.extraQueryParams,
    }: CreateSignoutRequestArgs = {}): Promise<SignoutRequest> {
        const logger = this._logger.create("createSignoutRequest");

        const url = await this.metadataService.getEndSessionEndpoint();
        if (!url) {
            logger.throw(new Error("No end session endpoint"));
            throw null; // https://github.com/microsoft/TypeScript/issues/46972
        }

        logger.debug("Received end session endpoint", url);

        const request = new SignoutRequest({
            url,
            id_token_hint,
            post_logout_redirect_uri,
            state_data: state,
            extraQueryParams,
            request_type,
        });

        // house cleaning
        await this.clearStaleState();

        const signoutState = request.state;
        if (signoutState) {
            logger.debug("Signout request has state to persist");
            await this.settings.stateStore.set(signoutState.id, signoutState.toStorageString());
        }

        return request;
    }

    public async readSignoutResponseState(url: string, removeState = false): Promise<{ state: State | undefined; response: SignoutResponse }> {
        const logger = this._logger.create("readSignoutResponseState");

        const response = new SignoutResponse(UrlUtils.readParams(url, this.settings.response_mode));
        if (!response.state) {
            logger.debug("No state in response");

            if (response.error) {
                logger.warn("Response was error:", response.error);
                throw new ErrorResponse(response);
            }

            return { state: undefined, response };
        }

        const storedStateString = await this.settings.stateStore[removeState ? "remove" : "get"](response.state);
        if (!storedStateString) {
            logger.throw(new Error("No matching state found in storage"));
            throw null; // https://github.com/microsoft/TypeScript/issues/46972
        }

        const state = State.fromStorageString(storedStateString);
        return { state, response };
    }

    public async processSignoutResponse(url: string): Promise<SignoutResponse> {
        const logger = this._logger.create("processSignoutResponse");

        const { state, response } = await this.readSignoutResponseState(url, true);
        if (state) {
            logger.debug("Received state from storage; validating response");
            this._validator.validateSignoutResponse(response, state);
        } else {
            logger.debug("No state from storage; skipping response validation");
        }

        return response;
    }

    public clearStaleState(): Promise<void> {
        this._logger.create("clearStaleState");
        return State.clearStaleState(this.settings.stateStore, this.settings.staleStateAgeInSeconds);
    }

    public async revokeToken(token: string, type?: "access_token" | "refresh_token"): Promise<void> {
        this._logger.create("revokeToken");
        return await this._tokenClient.revoke({
            token,
            token_type_hint: type,
        });
    }
}
