// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, JwtUtils } from "./utils";
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

const ProtocolClaims = ["at_hash", "iat", "nbf", "exp", "aud", "iss", "c_hash"];

export class ResponseValidator {
    protected readonly _settings: OidcClientSettingsStore;
    protected readonly _metadataService: MetadataService;
    protected readonly _userInfoService: UserInfoService;
    protected readonly _tokenClient: TokenClient;

    public constructor(settings: OidcClientSettingsStore, metadataService: MetadataService) {
        this._settings = settings;
        this._metadataService = metadataService;
        this._userInfoService = new UserInfoService(metadataService);
        this._tokenClient = new TokenClient(this._settings, metadataService);
    }

    public async validateSigninResponse(state: SigninState, response: SigninResponse): Promise<SigninResponse> {
        Log.debug("ResponseValidator.validateSigninResponse");

        response = this._processSigninParams(state, response);
        Log.debug("ResponseValidator.validateSigninResponse: state processed");

        response = await this._validateTokens(state, response);
        Log.debug("ResponseValidator.validateSigninResponse: tokens validated");

        response = await this._processClaims(state, response);
        Log.debug("ResponseValidator.validateSigninResponse: claims processed");

        return response;
    }

    public validateSignoutResponse(state: State, response: SignoutResponse): SignoutResponse {
        if (state.id !== response.state) {
            Log.error("ResponseValidator.validateSignoutResponse: State does not match");
            throw new Error("State does not match");
        }

        // now that we know the state matches, take the stored data
        // and set it into the response so callers can get their state
        // this is important for both success & error outcomes
        Log.debug("ResponseValidator.validateSignoutResponse: state validated");
        response.state = state.data;

        if (response.error) {
            Log.warn("ResponseValidator.validateSignoutResponse: Response was error", response.error);
            throw new ErrorResponse(response);
        }

        return response;
    }

    protected _processSigninParams(state: SigninState, response: SigninResponse): SigninResponse {
        if (state.id !== response.state) {
            Log.error("ResponseValidator._processSigninParams: State does not match");
            throw new Error("State does not match");
        }

        if (!state.client_id) {
            Log.error("ResponseValidator._processSigninParams: No client_id on state");
            throw new Error("No client_id on state");
        }

        if (!state.authority) {
            Log.error("ResponseValidator._processSigninParams: No authority on state");
            throw new Error("No authority on state");
        }

        // ensure we're using the correct authority
        if (this._settings.authority !== state.authority) {
            Log.error("ResponseValidator._processSigninParams: authority mismatch on settings vs. signin state");
            throw new Error("authority mismatch on settings vs. signin state");
        }
        if (this._settings.client_id && this._settings.client_id !== state.client_id) {
            Log.error("ResponseValidator._processSigninParams: client_id mismatch on settings vs. signin state");
            throw new Error("client_id mismatch on settings vs. signin state");
        }

        // now that we know the state matches, take the stored data
        // and set it into the response so callers can get their state
        // this is important for both success & error outcomes
        Log.debug("ResponseValidator._processSigninParams: state validated");
        response.state = state.data;

        if (response.error) {
            Log.warn("ResponseValidator._processSigninParams: Response was error", response.error);
            throw new ErrorResponse(response);
        }

        if (state.code_verifier && !response.code) {
            Log.error("ResponseValidator._processSigninParams: Expecting code in response");
            throw new Error("No code in response");
        }

        if (!state.code_verifier && response.code) {
            Log.error("ResponseValidator._processSigninParams: Not expecting code in response");
            throw new Error("Unexpected code in response");
        }

        if (!response.scope) {
            // if there's no scope on the response, then assume all scopes granted (per-spec) and copy over scopes from original request
            response.scope = state.scope;
        }

        return response;
    }

    protected async _processClaims(state: SigninState, response: SigninResponse): Promise<SigninResponse> {
        if (response.isOpenIdConnect) {
            Log.debug("ResponseValidator._processClaims: response is OIDC, processing claims");
            response.profile = this._filterProtocolClaims(response.profile);

            if (state.skipUserInfo !== true && this._settings.loadUserInfo && response.access_token) {
                Log.debug("ResponseValidator._processClaims: loading user info");

                const claims  = await this._userInfoService.getClaims(response.access_token);
                Log.debug("ResponseValidator._processClaims: user info claims received from user info endpoint");

                if (claims.sub !== response.profile.sub) {
                    Log.error("ResponseValidator._processClaims: sub from user info endpoint does not match sub in id_token");
                    throw new Error("sub from user info endpoint does not match sub in id_token");
                }

                response.profile = this._mergeClaims(response.profile, claims);
                Log.debug("ResponseValidator._processClaims: user info claims received, updated profile:", response.profile);

                return response;
            }
            else {
                Log.debug("ResponseValidator._processClaims: not loading user info");
            }
        }
        else {
            Log.debug("ResponseValidator._processClaims: response is not OIDC, not processing claims");
        }

        return response;
    }

    protected _mergeClaims(claims1: UserProfile, claims2: any): UserProfile {
        const result = Object.assign({}, claims1 as Record<string, any>);

        for (const name in claims2) {
            let values = claims2[name];
            if (!Array.isArray(values)) {
                values = [values];
            }

            for (let i = 0; i < values.length; i++) {
                const value = values[i];
                if (!result[name]) {
                    result[name] = value;
                }
                else if (Array.isArray(result[name])) {
                    if (result[name].indexOf(value) < 0) {
                        result[name].push(value);
                    }
                }
                else if (result[name] !== value) {
                    if (typeof value === "object" && this._settings.mergeClaims) {
                        result[name] = this._mergeClaims(result[name], value);
                    }
                    else {
                        result[name] = [result[name], value];
                    }
                }
            }
        }

        return result;
    }

    protected _filterProtocolClaims(claims: UserProfile): UserProfile {
        Log.debug("ResponseValidator._filterProtocolClaims, incoming claims:", claims);

        const result = Object.assign({}, claims as Record<string, any>);

        if (this._settings.filterProtocolClaims) {
            ProtocolClaims.forEach(type => {
                delete result[type];
            });

            Log.debug("ResponseValidator._filterProtocolClaims: protocol claims filtered", result);
        }
        else {
            Log.debug("ResponseValidator._filterProtocolClaims: protocol claims not filtered");
        }

        return result;
    }

    protected async _validateTokens(state: SigninState, response: SigninResponse): Promise<SigninResponse> {
        if (response.code) {
            Log.debug("ResponseValidator._validateTokens: Validating code");
            return this._processCode(state, response);
        }

        Log.debug("ResponseValidator._validateTokens: No code to process");
        return response;
    }

    protected async _processCode(state: SigninState, response: SigninResponse): Promise<SigninResponse> {
        const request = {
            client_id: state.client_id,
            client_secret: state.client_secret,
            code : response.code,
            redirect_uri: state.redirect_uri,
            code_verifier: state.code_verifier || ""
        };

        if (state.extraTokenParams && typeof(state.extraTokenParams) === "object") {
            Object.assign(request, state.extraTokenParams);
        }

        const tokenResponse = await this._tokenClient.exchangeCode(request);
        // merge
        response.error = tokenResponse.error || response.error;
        response.error_description = tokenResponse.error_description || response.error_description;
        response.error_uri = tokenResponse.error_uri || response.error_uri;

        response.id_token = tokenResponse.id_token || response.id_token;
        response.session_state = tokenResponse.session_state || response.session_state;
        response.access_token = tokenResponse.access_token || response.access_token;
        response.refresh_token = tokenResponse.refresh_token || response.refresh_token;

        response.token_type = tokenResponse.token_type || response.token_type;
        response.scope = tokenResponse.scope || response.scope;
        response.expires_in = parseInt(tokenResponse.expires_in) || response.expires_in;

        if (response.id_token) {
            Log.debug("ResponseValidator._processCode: token response successful, processing id_token");
            return this._validateIdTokenAttributes(state, response, response.id_token);
        }

        Log.debug("ResponseValidator._processCode: token response successful, returning response");
        return response;
    }

    protected async _validateIdTokenAttributes(state: SigninState, response: SigninResponse, id_token: string): Promise<SigninResponse> {
        Log.debug("ResponseValidator._validateIdTokenAttributes: Decoding JWT attributes");

        const payload = JwtUtils.decode(id_token);

        if (!payload.sub) {
            Log.error("ResponseValidator._validateIdTokenAttributes: No sub present in id_token");
            throw new Error("No sub present in id_token");
        }

        response.profile = payload;
        return response;
    }
}
