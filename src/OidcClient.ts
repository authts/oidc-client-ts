// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "./utils";
import { OidcClientSettings, OidcClientSettingsStore } from "./OidcClientSettings";
import { ErrorResponse } from "./ErrorResponse";
import { SigninRequest } from "./SigninRequest";
import { SigninResponse } from "./SigninResponse";
import { SignoutRequest } from "./SignoutRequest";
import { SignoutResponse } from "./SignoutResponse";
import { SigninState } from "./SigninState";
import { StateStore } from "./StateStore";
import { State } from "./State";

export class OidcClient {
    protected _settings: OidcClientSettingsStore

    constructor(settings: OidcClientSettings = {}) {
        this._settings = new OidcClientSettingsStore(settings);
    }

    get _stateStore() {
        return this.settings.stateStore;
    }
    get _validator() {
        return this.settings.validator;
    }
    get _metadataService() {
        return this.settings.metadataService;
    }

    get settings() {
        return this._settings;
    }
    get metadataService() {
        return this._metadataService;
    }

    async createSigninRequest({
        response_type, scope, redirect_uri,
        // data was meant to be the place a caller could indicate the data to
        // have round tripped, but people were getting confused, so i added state (since that matches the spec)
        // and so now if data is not passed, but state is then state will be used
        data, state, prompt, display, max_age, ui_locales, id_token_hint, login_hint, acr_values,
        resource, request, request_uri, response_mode, extraQueryParams, extraTokenParams, request_type, skipUserInfo
    }: any = {},
    stateStore?: StateStore
    ): Promise<SigninRequest> {
        Log.debug("OidcClient.createSigninRequest");

        const client_id = this._settings.client_id;
        response_type = response_type || this._settings.response_type;
        scope = scope || this._settings.scope;
        redirect_uri = redirect_uri || this._settings.redirect_uri;

        // id_token_hint, login_hint aren't allowed on _settings
        prompt = prompt || this._settings.prompt;
        display = display || this._settings.display;
        max_age = max_age || this._settings.max_age;
        ui_locales = ui_locales || this._settings.ui_locales;
        acr_values = acr_values || this._settings.acr_values;
        resource = resource || this._settings.resource;
        response_mode = response_mode || this._settings.response_mode;
        extraQueryParams = extraQueryParams || this._settings.extraQueryParams;
        extraTokenParams = extraTokenParams || this._settings.extraTokenParams;

        const authority = this._settings.authority;

        if (SigninRequest.isCode(response_type) && response_type !== "code") {
            throw new Error("OpenID Connect hybrid flow is not supported");
        }

        const url = await this._metadataService.getAuthorizationEndpoint();
        Log.debug("OidcClient.createSigninRequest: Received authorization endpoint", url);

        const signinRequest = new SigninRequest({
            url,
            client_id,
            redirect_uri,
            response_type,
            scope,
            data: data || state,
            authority,
            prompt, display, max_age, ui_locales, id_token_hint, login_hint, acr_values,
            resource, request, request_uri, extraQueryParams, extraTokenParams, request_type, response_mode,
            client_secret: this._settings.client_secret,
            skipUserInfo
        });

        const signinState = signinRequest.state;
        stateStore = stateStore || this._stateStore;
        await stateStore.set(signinState.id, signinState.toStorageString());
        return signinRequest;
    }

    async readSigninResponseState(url?: string, stateStore: StateStore | null = null, removeState = false) {
        Log.debug("OidcClient.readSigninResponseState");

        const useQuery = this._settings.response_mode === "query" ||
            (!this._settings.response_mode &&
                this._settings.response_type && SigninRequest.isCode(this._settings.response_type));
        const delimiter = useQuery ? "?" : "#";

        const response = new SigninResponse(url, delimiter);
        if (!response.state) {
            Log.error("OidcClient.readSigninResponseState: No state in response");
            throw new Error("No state in response");
        }

        stateStore = stateStore || this._stateStore;

        const stateApi = removeState ? stateStore.remove.bind(stateStore) : stateStore.get.bind(stateStore);

        const storedStateString = await stateApi(response.state);
        if (!storedStateString) {
            Log.error("OidcClient.readSigninResponseState: No matching state found in storage");
            throw new Error("No matching state found in storage");
        }

        const state = SigninState.fromStorageString(storedStateString);
        return {state, response};
    }

    async processSigninResponse(url: string, stateStore: StateStore | null = null) {
        Log.debug("OidcClient.processSigninResponse");

        const { state, response } = await this.readSigninResponseState(url, stateStore, true);
        Log.debug("OidcClient.processSigninResponse: Received state from storage; validating response");
        return this._validator.validateSigninResponse(state, response);
    }

    async createSignoutRequest({
        id_token_hint, data, state, post_logout_redirect_uri, extraQueryParams, request_type
    }: any = {},
    stateStore: StateStore | null = null
    ) {
        Log.debug("OidcClient.createSignoutRequest");

        post_logout_redirect_uri = post_logout_redirect_uri || this._settings.post_logout_redirect_uri;
        extraQueryParams = extraQueryParams || this._settings.extraQueryParams;

        const url = await this._metadataService.getEndSessionEndpoint();
        if (!url) {
            Log.error("OidcClient.createSignoutRequest: No end session endpoint url returned");
            throw new Error("no end session endpoint");
        }

        Log.debug("OidcClient.createSignoutRequest: Received end session endpoint", url);

        const request = new SignoutRequest({
            url,
            id_token_hint,
            post_logout_redirect_uri,
            data: data || state,
            extraQueryParams,
            request_type
        });

        const signoutState = request.state;
        if (signoutState) {
            Log.debug("OidcClient.createSignoutRequest: Signout request has state to persist");

            stateStore = stateStore || this._stateStore;
            void stateStore.set(signoutState.id, signoutState.toStorageString());
        }

        return request;
    }

    async readSignoutResponseState(url?: string, stateStore: StateStore | null = null, removeState = false)
        : Promise<{ state: undefined | State; response: SignoutResponse }> {
        Log.debug("OidcClient.readSignoutResponseState");

        const response = new SignoutResponse(url);
        if (!response.state) {
            Log.debug("OidcClient.readSignoutResponseState: No state in response");

            if (response.error) {
                Log.warn("OidcClient.readSignoutResponseState: Response was error: ", response.error);
                throw new ErrorResponse(response);
            }

            return {state: undefined, response};
        }

        const stateKey = response.state;

        stateStore = stateStore || this._stateStore;

        const stateApi = removeState ? stateStore.remove.bind(stateStore) : stateStore.get.bind(stateStore);
        const storedStateString = await stateApi(stateKey);
        if (!storedStateString) {
            Log.error("OidcClient.readSignoutResponseState: No matching state found in storage");
            throw new Error("No matching state found in storage");
        }

        const state = State.fromStorageString(storedStateString);
        return {state, response};
    }

    async processSignoutResponse(url: string, stateStore: StateStore | null = null) {
        Log.debug("OidcClient.processSignoutResponse");

        const {state, response} = await this.readSignoutResponseState(url, stateStore, true);
        if (state) {
            Log.debug("OidcClient.processSignoutResponse: Received state from storage; validating response");
            return this._validator.validateSignoutResponse(state, response);
        }
        else {
            Log.debug("OidcClient.processSignoutResponse: No state from storage; skipping validating response");
            return response;
        }
    }

    clearStaleState(stateStore: StateStore | null = null): Promise<void> {
        Log.debug("OidcClient.clearStaleState");

        stateStore = stateStore || this._stateStore;

        return State.clearStaleState(stateStore, this.settings.staleStateAge);
    }
}
