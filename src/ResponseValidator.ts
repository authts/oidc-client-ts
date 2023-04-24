// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, JwtUtils } from "./utils";
import { ErrorResponse } from "./errors";
import type { MetadataService } from "./MetadataService";
import { UserInfoService } from "./UserInfoService";
import { TokenClient } from "./TokenClient";
import type { OidcClientSettingsStore } from "./OidcClientSettings";
import type { SigninState } from "./SigninState";
import type { SigninResponse } from "./SigninResponse";
import type { State } from "./State";
import type { SignoutResponse } from "./SignoutResponse";
import type { UserProfile } from "./User";
import type { RefreshState } from "./RefreshState";
import type { IdTokenClaims } from "./Claims";
import type { ClaimsService } from "./ClaimsService";

/**
 * @internal
 */
export class ResponseValidator {
    protected readonly _logger = new Logger("ResponseValidator");
    protected readonly _userInfoService = new UserInfoService(this._settings, this._metadataService);
    protected readonly _tokenClient = new TokenClient(this._settings, this._metadataService);

    public constructor(
        protected readonly _settings: OidcClientSettingsStore,
        protected readonly _metadataService: MetadataService,
        protected readonly _claimsService: ClaimsService,
    ) {}

    public async validateSigninResponse(response: SigninResponse, state: SigninState): Promise<void> {
        const logger = this._logger.create("validateSigninResponse");

        this._processSigninState(response, state);
        logger.debug("state processed");

        await this._processCode(response, state);
        logger.debug("code processed");

        if (response.isOpenId) {
            this._validateIdTokenAttributes(response);
        }
        logger.debug("tokens validated");

        await this._processClaims(response, state?.skipUserInfo, response.isOpenId);
        logger.debug("claims processed");
    }

    public async validateCredentialsResponse(response: SigninResponse, skipUserInfo: boolean): Promise<void> {
        const logger = this._logger.create("validateCredentialsResponse");

        if (response.isOpenId) {
            this._validateIdTokenAttributes(response);
        }
        logger.debug("tokens validated");

        await this._processClaims(response, skipUserInfo, response.isOpenId);
        logger.debug("claims processed");
    }

    public async validateRefreshResponse(response: SigninResponse, state: RefreshState): Promise<void> {
        const logger = this._logger.create("validateRefreshResponse");

        response.userState = state.data;
        // if there's no session_state on the response, copy over session_state from original request
        response.session_state ??= state.session_state;
        // if there's no scope on the response, then assume all scopes granted (per-spec) and copy over scopes from original request
        response.scope ??= state.scope;

        // OpenID Connect Core 1.0 says that id_token is optional in refresh response:
        // https://openid.net/specs/openid-connect-core-1_0.html#RefreshTokenResponse
        if (response.isOpenId && !!response.id_token) {
            this._validateIdTokenAttributes(response, state.id_token);
            logger.debug("ID Token validated");
        }

        if (!response.id_token) {
            // if there's no id_token on the response, copy over id_token from original request
            response.id_token = state.id_token;
            // and decoded part too
            response.profile = state.profile;
        }

        const hasIdToken = response.isOpenId && !!response.id_token;
        await this._processClaims(response, false, hasIdToken);
        logger.debug("claims processed");
    }

    public validateSignoutResponse(response: SignoutResponse, state: State): void {
        const logger = this._logger.create("validateSignoutResponse");
        if (state.id !== response.state) {
            logger.throw(new Error("State does not match"));
        }

        // now that we know the state matches, take the stored data
        // and set it into the response so callers can get their state
        // this is important for both success & error outcomes
        logger.debug("state validated");
        response.userState = state.data;

        if (response.error) {
            logger.warn("Response was error", response.error);
            throw new ErrorResponse(response);
        }
    }

    protected _processSigninState(response: SigninResponse, state: SigninState): void {
        const logger = this._logger.create("_processSigninState");
        if (state.id !== response.state) {
            logger.throw(new Error("State does not match"));
        }

        if (!state.client_id) {
            logger.throw(new Error("No client_id on state"));
        }

        if (!state.authority) {
            logger.throw(new Error("No authority on state"));
        }

        // ensure we're using the correct authority
        if (this._settings.authority !== state.authority) {
            logger.throw(new Error("authority mismatch on settings vs. signin state"));
        }
        if (this._settings.client_id && this._settings.client_id !== state.client_id) {
            logger.throw(new Error("client_id mismatch on settings vs. signin state"));
        }

        // now that we know the state matches, take the stored data
        // and set it into the response so callers can get their state
        // this is important for both success & error outcomes
        logger.debug("state validated");
        response.userState = state.data;
        // if there's no scope on the response, then assume all scopes granted (per-spec) and copy over scopes from original request
        response.scope ??= state.scope;

        if (response.error) {
            logger.warn("Response was error", response.error);
            throw new ErrorResponse(response);
        }

        if (state.code_verifier && !response.code) {
            logger.throw(new Error("Expected code in response"));
        }

    }

    protected async _processClaims(response: SigninResponse, skipUserInfo = false, validateSub = true): Promise<void> {
        const logger = this._logger.create("_processClaims");
        response.profile = this._claimsService.filterProtocolClaims(response.profile);

        if (skipUserInfo || !this._settings.loadUserInfo || !response.access_token) {
            logger.debug("not loading user info");
            return;
        }

        logger.debug("loading user info");
        const claims = await this._userInfoService.getClaims(response.access_token);
        logger.debug("user info claims received from user info endpoint");

        if (validateSub && claims.sub !== response.profile.sub) {
            logger.throw(new Error("subject from UserInfo response does not match subject in ID Token"));
        }

        response.profile = this._claimsService.mergeClaims(response.profile, this._claimsService.filterProtocolClaims(claims as IdTokenClaims));
        logger.debug("user info claims received, updated profile:", response.profile);
    }

    protected async _processCode(response: SigninResponse, state: SigninState): Promise<void> {
        const logger = this._logger.create("_processCode");
        if (response.code) {
            logger.debug("Validating code");
            const tokenResponse = await this._tokenClient.exchangeCode({
                client_id: state.client_id,
                client_secret: state.client_secret,
                code: response.code,
                redirect_uri: state.redirect_uri,
                code_verifier: state.code_verifier,
                ...state.extraTokenParams,
            });
            Object.assign(response, tokenResponse);
        } else {
            logger.debug("No code to process");
        }
    }

    protected _validateIdTokenAttributes(response: SigninResponse, existingToken?: string): void {
        const logger = this._logger.create("_validateIdTokenAttributes");

        logger.debug("decoding ID Token JWT");
        const incoming = JwtUtils.decode(response.id_token ?? "");

        if (!incoming.sub) {
            logger.throw(new Error("ID Token is missing a subject claim"));
        }

        if (existingToken) {
            const existing = JwtUtils.decode(existingToken);
            if (incoming.sub !== existing.sub) {
                logger.throw(new Error("sub in id_token does not match current sub"));
            }
            if (incoming.auth_time && incoming.auth_time !== existing.auth_time) {
                logger.throw(new Error("auth_time in id_token does not match original auth_time"));
            }
            if (incoming.azp && incoming.azp !== existing.azp) {
                logger.throw(new Error("azp in id_token does not match original azp"));
            }
            if (!incoming.azp && existing.azp) {
                logger.throw(new Error("azp not in id_token, but present in original id_token"));
            }
        }

        response.profile = profile as UserProfile;
    }
}
