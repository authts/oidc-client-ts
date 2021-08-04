// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, JoseUtil } from "./utils";
import { INavigator, IFrameNavigator, PopupNavigator } from "./navigators";
import { OidcClient } from "./OidcClient";
import { UserManagerSettings, UserManagerSettingsStore } from "./UserManagerSettings";
import { User } from "./User";
import { UserManagerEvents } from "./UserManagerEvents";
import { SilentRenewService } from "./SilentRenewService";
import { SessionMonitor } from "./SessionMonitor";
import { SigninRequest } from "./SigninRequest";
import { TokenRevocationClient } from "./TokenRevocationClient";
import { TokenClient } from "./TokenClient";
import { SessionStatus } from "./SessionStatus";
import { SignoutResponse } from "./SignoutResponse";

export class UserManager extends OidcClient {
    protected _settings!: UserManagerSettingsStore /* TODO: port-ts */

    private readonly _events: UserManagerEvents;
    private readonly _silentRenewService: SilentRenewService;
    // @ts-ignore
    private readonly _sessionMonitor: SessionMonitor | null;
    private readonly _tokenRevocationClient: TokenRevocationClient;
    private readonly _tokenClient: TokenClient;

    constructor(
        settings: UserManagerSettings = {},
        SilentRenewServiceCtor = SilentRenewService,
        SessionMonitorCtor = SessionMonitor,
        TokenRevocationClientCtor = TokenRevocationClient,
        TokenClientCtor = TokenClient
    ) {
        super(settings);
        this._settings = new UserManagerSettingsStore(settings);

        this._events = new UserManagerEvents(this._settings);
        this._silentRenewService = new SilentRenewServiceCtor(this);

        // order is important for the following properties; these services depend upon the events.
        if (this.settings.automaticSilentRenew) {
            Log.debug("UserManager.ctor: automaticSilentRenew is configured, setting up silent renew");
            this.startSilentRenew();
        }

        this._sessionMonitor = null;
        if (this.settings.monitorSession) {
            Log.debug("UserManager.ctor: monitorSession is configured, setting up session monitor");
            this._sessionMonitor = new SessionMonitorCtor(this);
        }

        this._tokenRevocationClient = new TokenRevocationClientCtor(this._settings, this._settings.metadataService);
        this._tokenClient = new TokenClientCtor(this._settings, this._settings.metadataService);
    }

    get settings(): UserManagerSettingsStore {
        return this._settings;
    }

    get _redirectNavigator() {
        return this.settings.redirectNavigator;
    }
    get _popupNavigator() {
        return this.settings.popupNavigator;
    }
    get _iframeNavigator() {
        return this.settings.iframeNavigator;
    }
    get _userStore() {
        return this.settings.userStore;
    }

    get events() {
        return this._events;
    }

    async getUser(): Promise<User | null> {
        const user = await this._loadUser();
        if (user) {
            Log.info("UserManager.getUser: user loaded");

            this._events.load(user, false);

            return user;
        }
        else {
            Log.info("UserManager.getUser: user not found in storage");
            return null;
        }
    }

    async removeUser(): Promise<void> {
        await this.storeUser(null);
        Log.info("UserManager.removeUser: user removed from storage");
        this._events.unload();
    }

    async signinRedirect(args: any = {}): Promise<void> {
        args = Object.assign({}, args);

        args.request_type = "si:r";
        const navParams = {
            useReplaceToNavigate : args.useReplaceToNavigate
        };
        await this._signinStart(args, this._redirectNavigator, navParams);
        Log.info("UserManager.signinRedirect: successful");
    }
    async signinRedirectCallback(url?: string): Promise<User> {
        const user = await this._signinEnd(url || this._redirectNavigator.url);
        if (user.profile && user.profile.sub) {
            Log.info("UserManager.signinRedirectCallback: successful, signed in sub: ", user.profile.sub);
        }
        else {
            Log.info("UserManager.signinRedirectCallback: no sub");
        }

        return user;
    }

    async signinPopup(args: any = {}): Promise<User> {
        args = Object.assign({}, args);

        args.request_type = "si:p";
        const url = args.redirect_uri || this.settings.popup_redirect_uri || this.settings.redirect_uri;
        if (!url) {
            Log.error("UserManager.signinPopup: No popup_redirect_uri or redirect_uri configured");
            throw new Error("No popup_redirect_uri or redirect_uri configured");
        }

        args.redirect_uri = url;
        args.display = "popup";

        const user = await this._signin(args, this._popupNavigator, {
            startUrl: url,
            popupWindowFeatures: args.popupWindowFeatures || this.settings.popupWindowFeatures,
            popupWindowTarget: args.popupWindowTarget || this.settings.popupWindowTarget
        });
        if (user) {
            if (user.profile && user.profile.sub) {
                Log.info("UserManager.signinPopup: signinPopup successful, signed in sub: ", user.profile.sub);
            }
            else {
                Log.info("UserManager.signinPopup: no sub");
            }
        }

        return user;
    }
    async signinPopupCallback(url?: string): Promise<void> {
        try {
            await this._signinCallback(url, this._popupNavigator);
            Log.info("UserManager.signinPopupCallback: successful");
        }
        catch (err) {
            Log.error("UserManager.signinPopupCallback error: " + err && err.message);
        }
    }

    async signinSilent(args: any = {}): Promise<User | null> {
        args = Object.assign({}, args);

        // first determine if we have a refresh token, or need to use iframe
        const user = await this._loadUser();
        if (user && user.refresh_token) {
            args.refresh_token = user.refresh_token;
            return this._useRefreshToken(args);
        }
        else {
            args.request_type = "si:s";
            args.id_token_hint = args.id_token_hint || (this.settings.includeIdTokenInSilentRenew && user && user.id_token);
            if (user && this._settings.validateSubOnSilentRenew) {
                Log.debug("UserManager.signinSilent, subject prior to silent renew: ", user.profile.sub);
                args.current_sub = user.profile.sub;
            }
            return this._signinSilentIframe(args);
        }
    }

    async _useRefreshToken(args: any = {}) {
        const result = await this._tokenClient.exchangeRefreshToken(args);
        if (!result) {
            Log.error("UserManager._useRefreshToken: No response returned from token endpoint");
            throw new Error("No response returned from token endpoint");
        }
        if (!result.access_token) {
            Log.error("UserManager._useRefreshToken: No access token returned from token endpoint");
            throw new Error("No access token returned from token endpoint");
        }

        const user = await this._loadUser();
        if (user) {
            if (result.id_token) {
                await this._validateIdTokenFromTokenRefreshToken(user.profile, result.id_token);
            }

            Log.debug("UserManager._useRefreshToken: refresh token response success");
            user.id_token = result.id_token || user.id_token;
            user.access_token = result.access_token || user.access_token;
            user.refresh_token = /* TODO: port-TS result.refresh_token ||*/ user.refresh_token;
            user.expires_in = result.expires_in;

            await this.storeUser(user);
            this._events.load(user);
            return user;
        }
        else {
            return null;
        }
    }

    async _validateIdTokenFromTokenRefreshToken(profile: any, id_token: string) {
        const issuer = await this._metadataService.getIssuer();
        const now = await this.settings.getEpochTime();
        const payload = await JoseUtil.validateJwtAttributes(id_token, issuer, this._settings.client_id, this._settings.clockSkew, now);
        if (!payload) {
            Log.error("UserManager._validateIdTokenFromTokenRefreshToken: Failed to validate id_token");
            throw new Error("Failed to validate id_token");
        }
        if (payload.sub !== profile.sub) {
            Log.error("UserManager._validateIdTokenFromTokenRefreshToken: sub in id_token does not match current sub");
            throw new Error("sub in id_token does not match current sub");
        }
        if (payload.auth_time && payload.auth_time !== profile.auth_time) {
            Log.error("UserManager._validateIdTokenFromTokenRefreshToken: auth_time in id_token does not match original auth_time");
            throw new Error("auth_time in id_token does not match original auth_time");
        }
        if (payload.azp && payload.azp !== profile.azp) {
            Log.error("UserManager._validateIdTokenFromTokenRefreshToken: azp in id_token does not match original azp");
            throw new Error("azp in id_token does not match original azp");
        }
        if (!payload.azp && profile.azp) {
            Log.error("UserManager._validateIdTokenFromTokenRefreshToken: azp not in id_token, but present in original id_token");
            throw new Error("azp not in id_token, but present in original id_token");
        }
    }

    async _signinSilentIframe(args: any = {}) {
        const url = args.redirect_uri || this.settings.silent_redirect_uri || this.settings.redirect_uri;
        if (!url) {
            Log.error("UserManager.signinSilent: No silent_redirect_uri configured");
            throw new Error("No silent_redirect_uri configured");
        }

        args.redirect_uri = url;
        args.prompt = args.prompt || "none";

        const user = await this._signin(args, this._iframeNavigator, {
            startUrl: url,
            silentRequestTimeout: args.silentRequestTimeout || this.settings.silentRequestTimeout
        });
        if (user) {
            if (user.profile && user.profile.sub) {
                Log.info("UserManager.signinSilent: successful, signed in sub: ", user.profile.sub);
            }
            else {
                Log.info("UserManager.signinSilent: no sub");
            }
        }

        return user;
    }

    async signinSilentCallback(url?: string): Promise<void> {
        await this._signinCallback(url, this._iframeNavigator);
        Log.info("UserManager.signinSilentCallback: successful");
    }

    async signinCallback(url?: string): Promise<User | null> {
        const { state } = await this.readSigninResponseState(url);
        if (state.request_type === "si:r") {
            return this.signinRedirectCallback(url);
        }
        if (state.request_type === "si:p") {
            await this.signinPopupCallback(url);
            return null;
        }
        if (state.request_type === "si:s") {
            await this.signinSilentCallback(url);
            return null;
        }
        throw new Error("invalid response_type in state");
    }

    async signoutCallback(url?: string, keepOpen = false): Promise<void> {
        const { state } = await this.readSignoutResponseState(url);
        if (state) {
            if (state.request_type === "so:r") {
                await this.signoutRedirectCallback(url);
            }
            if (state.request_type === "so:p") {
                await this.signoutPopupCallback(url, keepOpen);
            }
            throw new Error("invalid response_type in state");
        }
    }

    async querySessionStatus(args: any = {}): Promise<SessionStatus | null> {
        args = Object.assign({}, args);

        args.request_type = "si:s"; // this acts like a signin silent
        const url = args.redirect_uri || this.settings.silent_redirect_uri || this.settings.redirect_uri;
        if (!url) {
            Log.error("UserManager.querySessionStatus: No silent_redirect_uri configured");
            throw new Error("No silent_redirect_uri configured");
        }

        args.redirect_uri = url;
        args.prompt = "none";
        args.response_type = args.response_type || this.settings.query_status_response_type;
        args.scope = args.scope || "openid";
        args.skipUserInfo = true;

        const navResponse = await this._signinStart(args, this._iframeNavigator, {
            startUrl: url,
            silentRequestTimeout: args.silentRequestTimeout || this.settings.silentRequestTimeout
        });
        try {
            const signinResponse = await this.processSigninResponse(navResponse.url);
            Log.debug("UserManager.querySessionStatus: got signin response");

            if (signinResponse.session_state && signinResponse.profile.sub) {
                Log.info("UserManager.querySessionStatus: querySessionStatus success for sub: ",  signinResponse.profile.sub);
                return {
                    session_state: signinResponse.session_state,
                    sub: signinResponse.profile.sub,
                    sid: signinResponse.profile.sid
                };
            }
            else {
                Log.info("querySessionStatus successful, user not authenticated");
                return null;
            }
        }
        catch (err) {
            if (err.session_state && this.settings.monitorAnonymousSession) {
                if (err.message == "login_required" ||
                    err.message == "consent_required" ||
                    err.message == "interaction_required" ||
                    err.message == "account_selection_required"
                ) {
                    Log.info("UserManager.querySessionStatus: querySessionStatus success for anonymous user");
                    return {
                        session_state: err.session_state
                    };
                }
            }

            throw err;
        }
    }

    async _signin(args: any, navigator: INavigator, navigatorParams: any = {}): Promise<User> {
        const navResponse = await this._signinStart(args, navigator, navigatorParams);
        return this._signinEnd(navResponse.url, args);
    }
    async _signinStart(args: any, navigator: INavigator, navigatorParams: any = {}) {
        const handle = await navigator.prepare(navigatorParams);
        Log.debug("UserManager._signinStart: got navigator window handle");

        try {
            const signinRequest = await this.createSigninRequest(args);
            Log.debug("UserManager._signinStart: got signin request");

            navigatorParams.url = signinRequest.url;
            navigatorParams.id = signinRequest.state.id;

            return handle.navigate(navigatorParams);
        }
        catch (err) {
            Log.debug("UserManager._signinStart: Error after preparing navigator, closing navigator window");
            handle.close();
            throw err;
        }
    }
    async _signinEnd(url: string, args: any = {}): Promise<User> {
        const signinResponse = await this.processSigninResponse(url);
        Log.debug("UserManager._signinEnd: got signin response");

        const user = new User(signinResponse);
        if (args.current_sub) {
            if (args.current_sub !== user.profile.sub) {
                Log.debug("UserManager._signinEnd: current user does not match user returned from signin. sub from signin: ", user.profile.sub);
                throw new Error("login_required");
            }
            else {
                Log.debug("UserManager._signinEnd: current user matches user returned from signin");
            }
        }

        await this.storeUser(user);
        Log.debug("UserManager._signinEnd: user stored");
        this._events.load(user);

        return user;
    }
    _signinCallback(url: string | undefined, navigator: IFrameNavigator | PopupNavigator): Promise<void> {
        Log.debug("UserManager._signinCallback");
        const useQuery = this._settings.response_mode === "query" || (!this._settings.response_mode && SigninRequest.isCode(this._settings.response_type));
        const delimiter = useQuery ? "?" : "#";
        return navigator.callback(url, false, delimiter);
    }

    async signoutRedirect(args: any = {}): Promise<void> {
        args = Object.assign({}, args);

        args.request_type = "so:r";
        const postLogoutRedirectUri = args.post_logout_redirect_uri || this.settings.post_logout_redirect_uri;
        if (postLogoutRedirectUri) {
            args.post_logout_redirect_uri = postLogoutRedirectUri;
        }
        const navParams = {
            useReplaceToNavigate : args.useReplaceToNavigate
        };
        await this._signoutStart(args, this._redirectNavigator, navParams);
        Log.info("UserManager.signoutRedirect: successful");
    }
    async signoutRedirectCallback(url?: string): Promise<SignoutResponse> {
        const response = await this._signoutEnd(url || this._redirectNavigator.url);
        Log.info("UserManager.signoutRedirectCallback: successful");
        return response;
    }

    async signoutPopup(args: any = {}): Promise<void> {
        args = Object.assign({}, args);

        args.request_type = "so:p";
        const url = args.post_logout_redirect_uri || this.settings.popup_post_logout_redirect_uri || this.settings.post_logout_redirect_uri;
        args.post_logout_redirect_uri = url;
        args.display = "popup";
        if (args.post_logout_redirect_uri) {
            // we're putting a dummy entry in here because we
            // need a unique id from the state for notification
            // to the parent window, which is necessary if we
            // plan to return back to the client after signout
            // and so we can close the popup after signout
            args.state = args.state || {};
        }

        await this._signout(args, this._popupNavigator, {
            startUrl: url,
            popupWindowFeatures: args.popupWindowFeatures || this.settings.popupWindowFeatures,
            popupWindowTarget: args.popupWindowTarget || this.settings.popupWindowTarget
        });
        Log.info("UserManager.signoutPopup: successful");
    }
    async signoutPopupCallback(url: any, keepOpen: any) {
        if (typeof(keepOpen) === "undefined" && typeof(url) === "boolean") {
            keepOpen = url;
            url = null;
        }

        const delimiter = "?";
        await this._popupNavigator.callback(url, keepOpen, delimiter);
        Log.info("UserManager.signoutPopupCallback: successful");
    }

    async _signout(args: any, navigator: INavigator, navigatorParams: any = {}) {
        const navResponse = await this._signoutStart(args, navigator, navigatorParams);
        return this._signoutEnd(navResponse.url);
    }
    async _signoutStart(args: any = {}, navigator: INavigator, navigatorParams: any = {}) {
        const handle = await navigator.prepare(navigatorParams);
        Log.debug("UserManager._signoutStart: got navigator window handle");

        try {
            const user = await this._loadUser();
            Log.debug("UserManager._signoutStart: loaded current user from storage");

            if (this._settings.revokeAccessTokenOnSignout) {
                await this._revokeInternal(user);
            }

            const id_token = args.id_token_hint || user && user.id_token;
            if (id_token) {
                Log.debug("UserManager._signoutStart: Setting id_token into signout request");
                args.id_token_hint = id_token;
            }

            await this.removeUser();
            Log.debug("UserManager._signoutStart: user removed, creating signout request");

            const signoutRequest = await this.createSignoutRequest(args);
            Log.debug("UserManager._signoutStart: got signout request");

            navigatorParams.url = signoutRequest.url;
            if (signoutRequest.state) {
                navigatorParams.id = signoutRequest.state.id;
            }
            return handle.navigate(navigatorParams);
        }
        catch (err) {
            Log.debug("UserManager._signoutStart: Error after preparing navigator, closing navigator window");
            handle.close();
            throw err;
        }
    }
    async _signoutEnd(url: string) {
        const signoutResponse = await this.processSignoutResponse(url);
        Log.debug("UserManager._signoutEnd: got signout response");

        return signoutResponse;
    }

    async revokeAccessToken(): Promise<void> {
        const user = await this._loadUser();
        const success = await this._revokeInternal(user, true);
        if (success && user) {
            Log.debug("UserManager.revokeAccessToken: removing token properties from user and re-storing");

            user.access_token = "";
            user.refresh_token = "";
            user.expires_at = 0;
            user.token_type = "";

            await this.storeUser(user);
            Log.debug("UserManager.revokeAccessToken: user stored");
            this._events.load(user);
        }

        Log.info("UserManager.revokeAccessToken: access token revoked successfully");
    }

    async _revokeInternal(user: User | null, required = false): Promise<boolean> {
        if (user) {
            const access_token = user.access_token;
            const refresh_token = user.refresh_token;

            const atSuccess = await this._revokeAccessTokenInternal(access_token, required);
            const rtSuccess = await this._revokeRefreshTokenInternal(refresh_token, required);
            if (!atSuccess && !rtSuccess) {
                Log.debug("UserManager.revokeAccessToken: no need to revoke due to no token(s), or JWT format");
            }

            return atSuccess || rtSuccess;
        }

        return false;
    }

    async _revokeAccessTokenInternal(access_token: string, required: boolean): Promise<boolean> {
        // check for JWT vs. reference token
        if (!access_token || access_token.indexOf(".") >= 0) {
            return false;
        }

        await this._tokenRevocationClient.revoke(access_token, required);
        return true;
    }

    async _revokeRefreshTokenInternal(refresh_token: string, required: boolean): Promise<boolean> {
        if (!refresh_token) {
            return false;
        }

        await this._tokenRevocationClient.revoke(refresh_token, required, "refresh_token");
        return true;
    }

    startSilentRenew(): void {
        this._silentRenewService.start();
    }

    stopSilentRenew(): void {
        this._silentRenewService.stop();
    }

    get _userStoreKey() {
        return `user:${this.settings.authority}:${this.settings.client_id}`;
    }

    async _loadUser() {
        const storageString = await this._userStore.get(this._userStoreKey);
        if (storageString) {
            Log.debug("UserManager._loadUser: user storageString loaded");
            return User.fromStorageString(storageString);
        }

        Log.debug("UserManager._loadUser: no user storageString");
        return null;
    }

    async storeUser(user: User | null): Promise<void> {
        if (user) {
            Log.debug("UserManager.storeUser: storing user");

            const storageString = user.toStorageString();
            await this._userStore.set(this._userStoreKey, storageString);
        }
        else {
            Log.debug("storeUser.storeUser: removing user");
            await this._userStore.remove(this._userStoreKey);
        }
    }
}
