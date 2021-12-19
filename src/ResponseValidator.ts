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

/**
 * @internal
 */
const ProtocolClaims = ["at_hash", "iat", "nbf", "exp", "aud", "iss", "c_hash"];

/**
 * @internal
 */
export class ResponseValidator {
    protected readonly _settings: OidcClientSettingsStore;
    protected readonly _logger: Logger;
    protected readonly _metadataService: MetadataService;
    protected readonly _userInfoService: UserInfoService;
    protected readonly _tokenClient: TokenClient;

    public constructor(settings: OidcClientSettingsStore, metadataService: MetadataService) {
        this._settings = settings;
        this._logger = new Logger("ResponseValidator");
        this._metadataService = metadataService;
        this._userInfoService = new UserInfoService(metadataService);
        this._tokenClient = new TokenClient(this._settings, metadataService);
    }

    public async validateSigninResponse(state: SigninState, response: SigninResponse): Promise<SigninResponse> {
        this._logger.debug("validateSigninResponse");

        response = this._processSigninParams(state, response);
        this._logger.debug("validateSigninResponse: state processed");

        response = await this._validateTokens(state, response);
        this._logger.debug("validateSigninResponse: tokens validated");

        response = await this._processClaims(state, response);
        this._logger.debug("validateSigninResponse: claims processed");

        return response;
    }

    public validateSignoutResponse(state: State, response: SignoutResponse): SignoutResponse {
        if (state.id !== response.state_id) {
            this._logger.error("validateSignoutResponse: State does not match");
            throw new Error("State does not match");
        }

        // now that we know the state matches, take the stored data
        // and set it into the response so callers can get their state
        // this is important for both success & error outcomes
        this._logger.debug("validateSignoutResponse: state validated");
        response.state = state.data;

        if (response.error) {
            this._logger.warn("validateSignoutResponse: Response was error", response.error);
            throw new ErrorResponse(response);
        }

        return response;
    }

    protected _processSigninParams(state: SigninState, response: SigninResponse): SigninResponse {
        if (state.id !== response.state_id) {
            this._logger.error("_processSigninParams: State does not match");
            throw new Error("State does not match");
        }

        if (!state.client_id) {
            this._logger.error("_processSigninParams: No client_id on state");
            throw new Error("No client_id on state");
        }

        if (!state.authority) {
            this._logger.error("_processSigninParams: No authority on state");
            throw new Error("No authority on state");
        }

        // ensure we're using the correct authority
        if (this._settings.authority !== state.authority) {
            this._logger.error("_processSigninParams: authority mismatch on settings vs. signin state");
            throw new Error("authority mismatch on settings vs. signin state");
        }
        if (this._settings.client_id && this._settings.client_id !== state.client_id) {
            this._logger.error("_processSigninParams: client_id mismatch on settings vs. signin state");
            throw new Error("client_id mismatch on settings vs. signin state");
        }

        // now that we know the state matches, take the stored data
        // and set it into the response so callers can get their state
        // this is important for both success & error outcomes
        this._logger.debug("_processSigninParams: state validated");
        response.state = state.data;

        if (response.error) {
            this._logger.warn("_processSigninParams: Response was error", response.error);
            throw new ErrorResponse(response);
        }

        if (state.code_verifier && !response.code) {
            this._logger.error("_processSigninParams: Expecting code in response");
            throw new Error("No code in response");
        }

        if (!state.code_verifier && response.code) {
            this._logger.error("_processSigninParams: Not expecting code in response");
            throw new Error("Unexpected code in response");
        }

        if (!response.scope) {
            // if there's no scope on the response, then assume all scopes granted (per-spec) and copy over scopes from original request
            response.scope = state.scope;
        }

        return response;
    }

    protected async _processClaims(state: SigninState, response: SigninResponse): Promise<SigninResponse> {
        if (!response.isOpenIdConnect) {
            this._logger.debug("_processClaims: response is not OIDC, not processing claims");
            return response;
        }
        this._logger.debug("_processClaims: response is OIDC, processing claims");
        response.profile = this._filterProtocolClaims(response.profile);

        if (state.skipUserInfo || !this._settings.loadUserInfo || !response.access_token) {
            this._logger.debug("_processClaims: not loading user info");
            return response;
        }

        this._logger.debug("_processClaims: loading user info");

        const claims = await this._userInfoService.getClaims(response.access_token);
        this._logger.debug("_processClaims: user info claims received from user info endpoint");

        if (claims.sub !== response.profile.sub) {
            this._logger.error("_processClaims: sub from user info endpoint does not match sub in id_token");
            throw new Error("sub from user info endpoint does not match sub in id_token");
        }

        response.profile = this._mergeClaims(response.profile, claims);
        this._logger.debug("_processClaims: user info claims received, updated profile:", response.profile);

        return response;
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
            ProtocolClaims.forEach(type => {
                delete result[type];
            });

            this._logger.debug("_filterProtocolClaims: protocol claims filtered:", result);
        }
        else {
            this._logger.debug("_filterProtocolClaims: protocol claims not filtered");
        }

        return result;
    }

    protected async _validateTokens(state: SigninState, response: SigninResponse): Promise<SigninResponse> {
        if (response.code) {
            this._logger.debug("_validateTokens: Validating code");
            return await this._processCode(state, response);
        }

        this._logger.debug("_validateTokens: No code to process");
        return response;
    }

    protected async _processCode(state: SigninState, response: SigninResponse): Promise<SigninResponse> {
        const request = {
            client_id: state.client_id,
            client_secret: state.client_secret,
            code : response.code,
            redirect_uri: state.redirect_uri,
            code_verifier: state.code_verifier || "",
        };

        if (state.extraTokenParams && typeof(state.extraTokenParams) === "object") {
            Object.assign(request, state.extraTokenParams);
        }

        // merge
        const { expires_in, ...tokenResponse } = await this._tokenClient.exchangeCode(request);
        Object.assign(response, tokenResponse);
        if (expires_in) response.expires_in = Number(expires_in);
        if (response.id_token) {
            this._logger.debug("_processCode: token response successful, processing id_token");
            return this._validateIdTokenAttributes(response, response.id_token);
        }

        this._logger.debug("_processCode: token response successful, returning response");
        return response;
    }

    protected _validateIdTokenAttributes(response: SigninResponse, id_token: string): SigninResponse {
        this._logger.debug("_validateIdTokenAttributes: Decoding JWT attributes");

        const payload = JwtUtils.decode(id_token);

        if (!payload.sub) {
            this._logger.error("_validateIdTokenAttributes: No sub present in id_token");
            throw new Error("No sub present in id_token");
        }

        response.profile = payload;
        return response;
    }
}
