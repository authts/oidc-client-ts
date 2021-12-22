// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, JwtUtils, JwtPayload } from "./utils";
import type { MetadataService } from "./MetadataService";
import { UserInfoService } from "./UserInfoService";
import { TokenClient } from "./TokenClient";
import { ErrorResponse } from "./ErrorResponse";
import type { OidcClientSettingsStore } from "./OidcClientSettings";
import type { SigninState } from "./SigninState";
import type { SigninResponse } from "./SigninResponse";
import type { State } from "./State";
import type { SignoutResponse } from "./SignoutResponse";
import type { UserProfile } from "./User";
import type { RefreshState } from "./RefreshState";

/**
 * Derived from the following sets of claims:
 * - {@link https://datatracker.ietf.org/doc/html/rfc7519.html#section-4.1}
 * - {@link https://openid.net/specs/openid-connect-core-1_0.html#IDToken}
 * - {@link https://openid.net/specs/openid-connect-core-1_0.html#CodeIDToken}
 *
 * @internal
 */
const ProtocolClaims = [
    "iss",
    // "sub" should never be excluded, we need access to it internally
    "aud",
    "exp",
    "nbf",
    "iat",
    "jti",
    "auth_time",
    "nonce",
    "acr",
    "amr",
    "azp",
    // https://openid.net/specs/openid-connect-core-1_0.html#CodeIDToken
    "at_hash",
] as const;

/**
 * @internal
 */
export class ResponseValidator {
    protected readonly _logger = new Logger("ResponseValidator");
    protected readonly _userInfoService = new UserInfoService(this._metadataService);
    protected readonly _tokenClient = new TokenClient(this._settings, this._metadataService);

    public constructor(
        protected readonly _settings: OidcClientSettingsStore,
        protected readonly _metadataService: MetadataService,
    ) {}

    public async validateSigninResponse(response: SigninResponse, state: SigninState): Promise<void> {
        this._logger.debug("validateSigninResponse");

        this._processSigninState(response, state);
        this._logger.debug("validateSigninResponse: state processed");

        await this._processCode(response, state);
        this._logger.debug("validateSigninResponse: code processed");

        if (response.isOpenId) {
            this._validateIdTokenAttributes(response);
        }
        this._logger.debug("validateSigninResponse: tokens validated");

        await this._processClaims(response, state?.skipUserInfo);
        this._logger.debug("validateSigninResponse: claims processed");
    }

    public async validateRefreshResponse(response: SigninResponse, state: RefreshState): Promise<void> {
        this._logger.debug("validateRefreshResponse");

        response.userState = state.data;
        // if there's no scope on the response, then assume all scopes granted (per-spec) and copy over scopes from original request
        response.scope ??= state.scope;

        if (response.isOpenId) {
            this._validateIdTokenAttributes(response, state.id_token);
        }
        this._logger.debug("validateSigninResponse: tokens validated");
        await this._processClaims(response);
        this._logger.debug("validateSigninResponse: claims processed");
    }

    public validateSignoutResponse(response: SignoutResponse, state: State): void {
        if (state.id !== response.state) {
            this._logger.error("validateSignoutResponse: State does not match");
            throw new Error("State does not match");
        }

        // now that we know the state matches, take the stored data
        // and set it into the response so callers can get their state
        // this is important for both success & error outcomes
        this._logger.debug("validateSignoutResponse: state validated");
        response.userState = state.data;

        if (response.error) {
            this._logger.warn("validateSignoutResponse: Response was error", response.error);
            throw new ErrorResponse(response);
        }
    }

    protected _processSigninState(response: SigninResponse, state: SigninState): void {
        if (state.id !== response.state) {
            this._logger.error("_processSigninState: State does not match");
            throw new Error("State does not match");
        }

        if (!state.client_id) {
            this._logger.error("_processSigninState: No client_id on state");
            throw new Error("No client_id on state");
        }

        if (!state.authority) {
            this._logger.error("_processSigninState: No authority on state");
            throw new Error("No authority on state");
        }

        // ensure we're using the correct authority
        if (this._settings.authority !== state.authority) {
            this._logger.error("_processSigninState: authority mismatch on settings vs. signin state");
            throw new Error("authority mismatch on settings vs. signin state");
        }
        if (this._settings.client_id && this._settings.client_id !== state.client_id) {
            this._logger.error("_processSigninState: client_id mismatch on settings vs. signin state");
            throw new Error("client_id mismatch on settings vs. signin state");
        }

        // now that we know the state matches, take the stored data
        // and set it into the response so callers can get their state
        // this is important for both success & error outcomes
        this._logger.debug("_processSigninState: state validated");
        response.userState = state.data;
        // if there's no scope on the response, then assume all scopes granted (per-spec) and copy over scopes from original request
        response.scope ??= state.scope;

        if (response.error) {
            this._logger.warn("_processSigninState: Response was error", response.error);
            throw new ErrorResponse(response);
        }

        if (state.code_verifier && !response.code) {
            this._logger.error("_processSigninState: Expecting code in response");
            throw new Error("No code in response");
        }

        if (!state.code_verifier && response.code) {
            this._logger.error("_processSigninState: Not expecting code in response");
            throw new Error("Unexpected code in response");
        }
    }

    protected async _processClaims(response: SigninResponse, skipUserInfo = false): Promise<void> {
        if (!response.isOpenId) {
            this._logger.debug("_processClaims: response is not OIDC, not processing claims");
            return;
        }
        this._logger.debug("_processClaims: response is OIDC, processing claims");
        response.profile = this._filterProtocolClaims(response.profile);

        if (skipUserInfo || !this._settings.loadUserInfo || !response.access_token) {
            this._logger.debug("_processClaims: not loading user info");
            return;
        }

        this._logger.debug("_processClaims: loading user info");

        const claims = await this._userInfoService.getClaims(response.access_token);
        this._logger.debug("_processClaims: user info claims received from user info endpoint");

        if (claims.sub !== response.profile.sub) {
            this._logger.error("_processClaims: subject from UserInfo response does not match subject in ID Token");
            throw new Error("subject from UserInfo response does not match subject in ID Token");
        }

        response.profile = this._mergeClaims(response.profile, this._filterProtocolClaims(claims));
        this._logger.debug("_processClaims: user info claims received, updated profile:", response.profile);
    }

    protected _mergeClaims(claims1: UserProfile, claims2: JwtPayload): UserProfile {
        const result = { ...claims1 };

        for (const [claim, values] of Object.entries(claims2)) {
            for (const value of Array.isArray(values) ? values : [values]) {
                const previousValue = result[claim];
                if (!previousValue) {
                    result[claim] = value;
                }
                else if (Array.isArray(previousValue)) {
                    if (!previousValue.includes(value)) {
                        previousValue.push(value);
                    }
                }
                else if (result[claim] !== value) {
                    if (typeof value === "object" && this._settings.mergeClaims) {
                        result[claim] = this._mergeClaims(previousValue as UserProfile, value);
                    }
                    else {
                        result[claim] = [previousValue, value];
                    }
                }
            }
        }

        return result;
    }

    protected _filterProtocolClaims(claims: UserProfile): UserProfile {
        this._logger.debug("_filterProtocolClaims, incoming claims:", claims);

        const result = { ...claims };

        if (this._settings.filterProtocolClaims) {
            for (const type of ProtocolClaims) {
                delete result[type];
            }
            this._logger.debug("_filterProtocolClaims: protocol claims filtered:", result);
        }
        else {
            this._logger.debug("_filterProtocolClaims: protocol claims not filtered");
        }

        return result;
    }

    protected async _processCode(response: SigninResponse, state: SigninState): Promise<void> {
        if (response.code) {
            this._logger.debug("_processCode: Validating code");
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
            this._logger.debug("_processCode: No code to process");
        }
    }

    protected _validateIdTokenAttributes(response: SigninResponse, currentToken?: string): void {
        this._logger.debug("_validateIdTokenAttributes: Decoding JWT attributes");

        const profile = JwtUtils.decode(response.id_token ?? "");

        if (!profile.sub) {
            this._logger.error("_validateIdTokenAttributes: No subject present in ID Token");
            throw new Error("No subject is present in ID Token");
        }

        if (currentToken) {
            const current = JwtUtils.decode(currentToken);
            if (current.sub !== profile.sub) {
                this._logger.error("_validateIdTokenFromTokenRefreshToken: sub in id_token does not match current sub");
                throw new Error("sub in id_token does not match current sub");
            }
            if (current.auth_time && current.auth_time !== profile.auth_time) {
                this._logger.error("_validateIdTokenFromTokenRefreshToken: auth_time in id_token does not match original auth_time");
                throw new Error("auth_time in id_token does not match original auth_time");
            }
            if (current.azp && current.azp !== profile.azp) {
                this._logger.error("_validateIdTokenFromTokenRefreshToken: azp in id_token does not match original azp");
                throw new Error("azp in id_token does not match original azp");
            }
            if (!current.azp && profile.azp) {
                this._logger.error("_validateIdTokenFromTokenRefreshToken: azp not in id_token, but present in original id_token");
                throw new Error("azp not in id_token, but present in original id_token");
            }
        }

        response.profile = profile;
    }
}
